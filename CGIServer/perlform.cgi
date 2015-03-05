#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use CGI::Carp qw(fatalsToBrowser);

my $q = new CGI;

print $q->header;

print $q->start_html(-title => 'A web form');

print $q->start_form(
    -name    => 'main_form',
    -method  => 'GET',
    -enctype => &CGI::URL_ENCODED,
    -onsubmit => 'return javascript:validation_function()',
    -action => '/where/your/form/gets/sent', # Defaults to 
    # the current program
    );

print $q->end_form;

print $q->textfield(
    -name      => 'text1',
    -value     => 'default value',
    -size      => 20,
    -maxlength => 30,
    );

print $q->submit(
-name     => 'submit_form',
-value    => 'Click here!',
-onsubmit => 'javascript: validate_form()',
);

print $q->end_html;

