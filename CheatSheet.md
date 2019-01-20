# Planet of the Automatons Cheat Sheet

## Linux
e### Moving Around
- show the full path to the current folder `pwd`
- show the contents of the current folder `ls`
    - with more detail `ls -l`
    - including 'hidden files' `ls -a`
    - these can be combined: `ls -la`
- change to a different folder (directory) `cd yourfolder` or `cd path/to/yourfolder`
    - move up a folder `cd ../`
    - these can be combined, e.g., `cd ../../yourfolder` means move up two folders and then into 'yourfolder' at that level

Note that if you start typing the name of a file or folder that exists in your current directory and then
press TAB, the terminal will complete the name for you. Less typing!

### Process control
- stop the current process: `^C` (press control-C)
- list all running processes `ps -ef -A`
- filter the list of running processes to just Node.js processes: `ps -ef | grep node`
- stop an individual Node.js process: `kill *process_number*`
- stop **all** Node processes: `pkill -f node`

### Permissions
- grant permission for all users to a file `chmod  755 /path/to/yourfile`
- grant permission for all user to all contents of a folder: `chmod  -R 755 /path/to/yourfolder`
