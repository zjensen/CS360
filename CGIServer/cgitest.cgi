#!/usr/bin/perl

use CGI qw/:standard/;

my $q = new CGI;

# print $q->header;

print $q->start_html("CGI Test Page"),
    $q->h1("CGI Test Page"),
    $q->h2("Post Test:"),
    $q->start_form(-method=>"POST",
        #-enctype=>&CGI::URL_ENCODED
               -action=>"cgitest.cgi"
    ),
    "Post Value: ",$q->textfield('postKey'),
    $q->submit("Submit Post"),
    $q->end_form;
    if ($q->param('postKey'))
    {
        print "Post Value: ".$q->param('postKey');
    }
    print $q->hr,
    $q->h2("Get Test:"),
    $q->start_form(-method=>"GET",
# To redirect this page to another page, uncomment the following line and update the location
      -action=>"cgitest.cgi"
    ),
    "Get Value: ",$q->textfield('getKey'),
    $q->submit("Submit Get"),
    $q->end_form;
    if ($q->param('getKey'))
    {
        print "Get Value: ".$q->param('getKey');
    }
print $q->end_html;

