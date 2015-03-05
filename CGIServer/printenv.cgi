#!/usr/bin/perl

use CGI;

$cgi = new CGI;


# Start the page by outputing the Content-type header
print $cgi->header;
print $cgi->start_html("Using the CGI class");

print "<h1>This is a list of the environment variables</h1>\n";
print $cgi->hr();

print "<pre>\n";

foreach $var (sort(keys(%ENV))) {
    $val = $ENV{$var};
    $val =~ s|\n|\\n|g;
    $val =~ s|"|\\"|g;
    print "${var}=\"${val}\"\n";
}

print "</pre>\n";

print $cgi->hr();

$reqmeth = $cgi->request_method();

if ($reqmeth eq "POST")
{
        print "<h2>This is a POST</h2>\n";
        print "The Query String is empty. The arguments come in the\n";
        print "body of the HTTP request message. Here it is.\n";

}
elsif ($reqmeth eq "GET")
{
        print "<h2>This is a GET</h2>\n";
        print "The Query String is in the environment\n";
}
else
{
        print "<h2>Unknown method</h2>\n";
}

print "<pre>\n";

@names = $cgi->param;
$i = 0;
foreach $n (@names)
{
        print "Arg $i name is: [$n]\n";
        $value = $cgi->param($n);
        print "Arg $i value is: [$value]\n";
        $i++;
}

print "</pre>\n";
print "<h2>All done now... bye</h2>\n";

print $cgi->end_html."\n";
