#include <sys/types.h>
#include <sys/socket.h>
#include <sys/mman.h>
#include <netinet/in.h>
#include <netdb.h>
#include <string.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <vector>
#include <fcntl.h>
#include <sys/stat.h>
#include <arpa/inet.h>
#include <semaphore.h>
#include <thread>
#include <queue>
#include <pthread.h>
#include <fstream>
#include <dirent.h>

#define SOCKET_ERROR        -1
#define BUFFER_SIZE         100
#define MESSAGE             "This is the message I'm sending back and forth"
#define QUEUE_SIZE          5000
#define MAX_MSG_SZ          1024
#define STAT_200            " 200 OK\r\n"
#define STAT_404            " 404 Not Found\r\n"
#define F_GIF               "Content-Type: image/gif\r\n"
#define F_HTML              "Content-Type: text/html\r\n"
#define F_JPG               "Content-Type: image/jpg\r\n"
#define F_TXT               "Content-Type: text/plain\r\n"
#define THREADS             10

using namespace std;

void chomp(char *line);
bool isWhitespace(char c);
char * GetLine(int fds);
void UpcaseAndReplaceDashWithUnderline(char *str);
char *FormatHeader(char *str, char *prefix);
void GetHeaderLines(vector<char *> &headerLines, int skt, bool envformat);
void* serve(void* in_data);



std::queue<int> work_tasks;
sem_t work_mutex; //one person on queue
sem_t work_to_do; //work on queue
sem_t space_on_q; //how much is left

struct thread_info
{
    int thread_id;
    int another_number;
};

int main(int argc, char* argv[])
{
    int hSocket,hServerSocket;  /* handle to socket */
    struct hostent* pHostInfo;   /* holds info about a machine */
    struct sockaddr_in Address; /* Internet socket address stuct */
    int nAddressSize=sizeof(struct sockaddr_in);
    char pBuffer[BUFFER_SIZE];
    int nHostPort, numThreads;
    char *dir;
    
    
    if(argc < 3)
    {
        printf("\nUsage: <port> <num threads> <dir> \n");
        return 0;
    }
    else
    {
        nHostPort=atoi(argv[1]);
        numThreads=atoi(argv[2]);
        dir = argv[3];
    }
    
    sem_init( &work_mutex, 0, 1 );
    sem_init( &work_to_do, 0, 0 );
    sem_init( &space_on_q, 0, 100 );
    
    pthread_t threads[ numThreads ];
    
    struct thread_info all_thread_info[ numThreads ];
//    cout << "\n\nTHREADS: " << numThreads << endl << endl;
    /* creates the number of threads requested */
    for( int i = 0; i < numThreads; i++ )
    {
//		std::cout<<"WAITING on mutex in thread creation loop"<<endl;
//		fflush(stdout);
		sem_wait( &work_mutex );
//		cout << "LOCKED mutex, creating thread: " << i << "\t" << std::endl;
//		fflush(stdout);
		all_thread_info[ i ].thread_id = i;
		pthread_create( &threads[i], NULL, serve, ( void* ) &all_thread_info[i] );
		sem_post( &work_mutex );
//		cout<<"UNLOCKED mutex in thread creation loop"<<endl;
//		fflush(stdout);
    }
    /* make a socket */
    hServerSocket=socket(AF_INET,SOCK_STREAM,0);
    
    if(hServerSocket == SOCKET_ERROR)
    {
//        printf("\nCould not make a socket\n");
        return 0;
    }
    int optval = 1;
    setsockopt (hServerSocket, SOL_SOCKET, SO_REUSEADDR, &optval, sizeof(optval));
    

    /* fill address struct */
    Address.sin_addr.s_addr=INADDR_ANY;
    Address.sin_port=htons(nHostPort);
    Address.sin_family=AF_INET;
    
    
    /* bind to a port */
    if(bind(hServerSocket,(struct sockaddr*)&Address,sizeof(Address))
       == SOCKET_ERROR)
    {
//        printf("\nCould not connect to host\nConsider using command \"ps\" to check current processes");
//        fflush(stdout);
        return 0;
    }
//    cout<<"Successfully bound socket"<<endl;

    /*  get port number */
    getsockname( hServerSocket, (struct sockaddr *) &Address,(socklen_t *)&nAddressSize);
//    printf("opened socket as fd (%d) on port (%d) for stream i/o\n",hServerSocket, ntohs(Address.sin_port) );
//    
//    printf("     *****Server Information*****\n\
//           sin_family        = %d\n\
//           sin_addr.s_addr   = %d\n\
//           sin_port          = %d\n"
//           , Address.sin_family
//           , Address.sin_addr.s_addr
//           , ntohs(Address.sin_port)
//           );
//    printf("     ****************************\n");
//    fflush(stdout);
    
    
//    printf("\nMaking a listen queue of %d elements\n",QUEUE_SIZE);
    /* establish listen queue */
    if(listen(hServerSocket,QUEUE_SIZE) == SOCKET_ERROR)
    {
        printf("\nCould not listen\n");
        return 0;
    }
    int counter = 0;
    while(1)
    {
//		printf("LOCKED mutex in eternal main loop\n");
//		fflush(stdout);
        sem_wait( &space_on_q);
        sem_wait( &work_mutex);
        
        work_tasks.push(counter);
        
        sem_post( &work_mutex);
        sem_post( &work_to_do);
//        printf("UNLOCKED mutex in eternal main loop\n");
//        fflush(stdout);

        counter++;
        
        char *response = (char *) malloc(sizeof(char) * 1024); //size of response headers
        response = (char *) malloc(sizeof(char) * 1024);
                
        strcat(response,"HTTP/1.0");
        
        
//        printf("\nWaiting for a connection\n");

        /* get the connected socket */
        hSocket=accept(hServerSocket,(struct sockaddr*)&Address,(socklen_t *)&nAddressSize);
        
//        printf("\nGot a connection on socket: %d\n", hSocket);
        
        char * firstLine = GetLine(hSocket); //GET path HTTP/1.1
        
        bool pathIsCorrect = false;
        
        bool isDirectory = false;
        
        bool isFavicon = false;
        
        char path [36]; //path of file client is requesting
        sscanf(firstLine,"%*s %s %*s",path);
        
        if(strcmp(path,"/favicon.ico") == 0)
        {
            isFavicon = true;
        }
        
        struct stat filestat;
        char relativePath[36];
        strcpy(relativePath,path); //copies the requested path
        strcpy(path,dir);
        strcat(path,relativePath); //path is now absolute path

        if(stat(path, &filestat)==-1) {
            cout <<"\nRequested file does not exist\n";
        }
        else if(S_ISREG(filestat.st_mode)) {
//			cout << "Found file\n";
            char * ext = strrchr(relativePath, '.'); //extension of file path
            if(strcmp(ext,".html") == 0) //ensures file is of correct type
            {
                pathIsCorrect = true;
                strcat(response,STAT_200);
//                strcat(response,"MIME-Version:1.0\r\n");
                strcat(response,F_HTML);
                char contentLength [50];
                sprintf(contentLength, "Content-Length: %d\r\n\r\n", filestat.st_size);
                strcat(response, contentLength);
            }
            else if(strcmp(ext,".jpg") == 0) //ensures file is of correct type
            {
                pathIsCorrect = true;
                strcat(response,STAT_200);
//                strcat(response,"MIME-Version:1.0\r\n");
                strcat(response,F_JPG);
                char contentLength [50];
                sprintf(contentLength, "Content-Length: %d\r\n\r\n", filestat.st_size);
                strcat(response, contentLength);
            }
            else if(strcmp(ext,".gif") == 0) //ensures file is of correct type
            {
                pathIsCorrect = true;
                strcat(response,STAT_200);
//                strcat(response,"MIME-Version:1.0\r\n");
                strcat(response,F_GIF);
                char contentLength [50];
                sprintf(contentLength, "Content-Length: %d\r\n\r\n", filestat.st_size);
                strcat(response, contentLength);
            }
            else if(strcmp(ext,".txt") == 0) //ensures file is of correct type
            {
                pathIsCorrect = true;
                strcat(response,STAT_200);
//                strcat(response,"MIME-Version:1.0\r\n");
                strcat(response,F_TXT);
                char contentLength [50];
                sprintf(contentLength, "Content-Length: %d\r\n\r\n", filestat.st_size);
                strcat(response, contentLength);
            }
        }
        else if(S_ISDIR(filestat.st_mode))
        {
            if(!isFavicon)
            {
                pathIsCorrect = true; //still need to check for an index.html, else send out the directory
//                cout << path << " is a directory \n";
                struct stat indexFile;
                char indexPath[36];
                strcpy(indexPath,path);
                strcat(indexPath,"/index.html");
                strcat(response,STAT_200);
                if(stat(indexPath, &indexFile))
                {
//                    cout <<"\nDirectory does not contain an index.html\n";
                    isDirectory = true;
                    pathIsCorrect = false;
//                    strcat(response,"MIME-Version:1.0\r\n");
                    strcat(response,F_HTML);
                    char contentLength [50];
                    sprintf(contentLength, "Content-Length: %d\r\n\r\n", indexFile.st_size);
                    strcat(response, contentLength);
                    strcpy(path,indexPath);
                }
                else
                {
//                    cout <<"\nDirectory contains an index.html\n";
                
//                    strcat(response,"MIME-Version:1.0\r\n");
                    strcat(response,F_HTML);
                    char contentLength [50];
                    sprintf(contentLength, "Content-Length: %d\r\n\r\n", indexFile.st_size);
                    strcat(response, contentLength);
                    strcpy(path,indexPath);
                }
            }
            
        }
        if(pathIsCorrect)
        {
            FILE *file = fopen(path,"r"); //opens file read-only
            
            write(hSocket, response, strlen(response)); //write response headers
            bzero((char*) &response, sizeof(response));
            
            for (;;) //writing file
            {
                unsigned char buff[256]={0}; //will send 256 bytes at a time
                int nread = fread(buff,1,256,file); //number of bites that have been read
                if(nread > 0) //while there are still bytes available to send
                {
                    write(hSocket, buff, nread);
                }
                if (nread < 256)
                {
                    if (feof(file))
//                        printf("End of file\n"); //we're at the end of the file, done
                    if (ferror(file))
//                        printf("Error reading\n"); //file couldnt be transfered successfully
                    break;
                }
            }
		}
		else if(isDirectory)
		{
//			cout << "Generating index.html for " << relativePath << endl;
			vector<string> children;
			DIR *dir;
			struct dirent *ent;
			string dirPath = path;
			if ((dir = opendir (dirPath.substr(0, dirPath.length() - 11).c_str())) != NULL)
			{
			  /* print all the files and directories within directory */
			  while ((ent = readdir (dir)) != NULL) 
			  {
				//printf ("%s\n", ent->d_name);
				children.push_back((string)ent->d_name);
			  }
			  closedir (dir);
			}
			string html = "<!DOCTYPE html><html><head><title> Directory for ";
			string rel = relativePath;
			html += relativePath;
			html += "</title></head><body>";
			html += "<h1> Directory for ";
			html += relativePath;
			html += "</h1><ul>";
			//for every element in the directory
			for(int i = 2; i < children.size(); ++i)
			{
				html += "<li><a href=\"";
				html += rel.substr(1, rel.length() - 1);
				html += "/";
				html += children[i];
				html += "\">";
				html += children[i];
				html += "</a></li>";
				//cout << html << endl;
			}
			
			html += "</ul></body></html>";
				
			write(hSocket, response, strlen(response));
			
				
			write(hSocket, html.c_str(), html.length());
			
			bzero((char*) &response, sizeof(response));
		}
        else
        {
//		    cout<<"Nothing to write, need to send back error HTML"<<endl;


            string output = "<html><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n<title>";
            output+="Page not found</title></head><body bgcolor=\"#FFFFFF\" text=\"#000000\"><p>";
            output+="</p><h2>Page not found</h2><p>You've requested a page that doesn't exist, sorry!";
            output+="</p><p></p><hr align=\"left\" width=\"20%\"><font size=\"-1\"> <i> Last Updated:</i> 29 January 2015<br> </font>";
            output+="</body></html>";
            
            strcat(response,STAT_404);
            strcat(response,F_HTML);
            char contentLength [50];
            sprintf(contentLength, "Content-Length: %d\r\n\r\n", 358);
            strcat(response, contentLength);

            FILE *file = fopen("cs360/error.html","r"); //opens file read-only

            write(hSocket, response, strlen(response));
            
            write(hSocket, output.c_str(), output.length());
		    		    
		    bzero((char*) &response, sizeof(response));
        }

        shutdown(hSocket, SHUT_RDWR);
//        printf("\nClosing the socket\n");
        /* close socket */
        if(close(hSocket) == SOCKET_ERROR)
        {
            printf("\nFailure to close socket\n");
            return 0;
        }
    }
}

void* serve( void* in_data )
{
    struct thread_info* t_info = ( struct thread_info* ) in_data;
    int tid = t_info->thread_id;

    while( 1 )
    {
//		cout<<"WAITING on mutex in eternal serve loop, thread: "<<tid<<endl;
//		fflush(stdout);
		sem_wait( &work_to_do );
//		cout<<"WORK WAITING thread in eternal serve loop"<<endl;
//		fflush(stdout);
		sem_wait( &work_mutex );
//		cout<<"LOCKED mutex in eternal serve loop, waiting on work to do"<<endl;
//		fflush(stdout);
		if(work_tasks.size()>0)
		{
			int work_thread = work_tasks.front();
			work_tasks.pop();
//			cout<<"Serving up thread " << tid << " in eternal serve loop, queue ID = "<<work_thread<<endl;
//			fflush(stdout);
		}


		sem_post( &work_mutex );
//		cout<<"UNLOCKED mutex in eternal serve loop"<<endl;
//		fflush(stdout);
		sem_post( &space_on_q );
    }
}


// Determine if the character is whitespace
bool isWhitespace(char c)
{ switch (c)
    {
        case '\r':
        case '\n':
        case ' ':
        case '\0':
            return true;
        default:
            return false;
    }
}

// Strip off whitespace characters from the end of the line
void chomp(char *line)
{
    int len = strlen(line);
    while (isWhitespace(line[len]))
    {
        line[len--] = '\0';
    }
}

// Read the line one character at a time, looking for the CR
// You dont want to read too far, or you will mess up the content
char * GetLine(int fds)
{
    char tline[MAX_MSG_SZ];
    char *line;
    
    int messagesize = 0;
    int amtread = 0;
    while((amtread = read(fds, tline + messagesize, 1)) < MAX_MSG_SZ)
    {
        if (amtread > 0)
            messagesize += amtread;
        else
        {
            perror("Socket Error is:");
            fprintf(stderr, "Read Failed on file descriptor %d messagesize = %d\n", fds, messagesize);
            exit(2);
        }
        //fprintf(stderr,"%d[%c]", messagesize,message[messagesize-1]);
        if (tline[messagesize - 1] == '\n')
            break;
    }
    tline[messagesize] = '\0';
    chomp(tline);
    line = (char *)malloc((strlen(tline) + 1) * sizeof(char));
    strcpy(line, tline);
    //fprintf(stderr, "GetLine: [%s]\n", line);
    return line;
}

// Change to upper case and replace with underlines for CGI scripts
void UpcaseAndReplaceDashWithUnderline(char *str)
{
    int i;
    char *s;
    s = str;
    cout << "\n\nHERE\n" << s << endl;
    for (i = 0; s[i] != ':'; i++)
    {
        if (s[i] >= 'a' && s[i] <= 'z')
        {
            cout << "\n\nHERE\n" << s << endl;
            s[i] = 'A' + (s[i] - 'a');
        }
        if (s[i] == '-')
        {
            cout << "\nhere2" << endl;
            s[i] = '_';
        }
    }
    cout << "\nhere!" << endl;
}


// When calling CGI scripts, you will have to convert header strings
// before inserting them into the environment.  This routine does most
// of the conversion
char *FormatHeader(char *str, char *prefix)
{
    char *result = (char *)malloc(strlen(str) + strlen(prefix));
    char* value = strchr(str,':') + 2;
    UpcaseAndReplaceDashWithUnderline(str);
    *(strchr(str,':')) = '\0';
    sprintf(result, "%s%s=%s", prefix, str, value);
    return result;
}

// Get the header lines from a socket
//   envformat = true when getting a request from a web client
//   envformat = false when getting lines from a CGI program

void GetHeaderLines(vector<char *> &headerLines, int skt, bool envformat)
{
    // Read the headers, look for specific ones that may change our responseCode
    char *line;
    char *tline;
    tline = GetLine(skt);
    while(strlen(tline) != 0)
    {
        if (strstr(tline, "Content-Length") ||
            strstr(tline, "Content-Type"))
        {
            if (envformat)
                line = FormatHeader(tline, "");
            else
                line = strdup(tline);
        }
        else
        {
            if (envformat)
                line = FormatHeader(tline, "HTTP_");
            else
            {
                line = (char *)malloc((strlen(tline) + 10) * sizeof(char));
                sprintf(line, "HTTP_%s", tline);
            }
        }
        fprintf(stderr, "Header --> [%s]\n", line);
        headerLines.push_back(line);
        free(tline);
        tline = GetLine(skt);
    }
    free(tline);
}
