#!/usr/bin/perl

print "ARGV[0]=",$ARGV[0], "\n";
print "ARGV[1]=",$ARGV[1], "\n";

$SERVER_NAME = $ENV{'SERVER_NAME'};
print "Server Name $SERVER_NAME\n";
exit(5);
