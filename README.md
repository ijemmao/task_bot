# DALI Dev Resources

##### A guide to a variety of tools that are helpful for devs to improve their workflow

These are mostly for OS X but all are available on linux and well if you use windows try out https://chocolatey.org/ but you’re on your own…

## Essential Tools:

- iTerm2  (http://iterm2.com)  this is a much better Terminal command line than the default Terminal.app  (its beautiful just use it)
- XCode  (https://developer.apple.com/xcode/)  this is the primary os x developer tools, it installs lots of basic things. After you install it from the App Store (update to the most recent OS is recommended!) run xcode-select --install in iTerm2 to install command line tools
- brew  (http://brew.sh/)  this is an open source software package manager.  Use it to install the following right away:
- autojump   (brew install autojump)  really useful for changing directories in the terminal,  j some_part_of_folder_name will jump to a folder you’ve been in recently that matches.
- mosh  (brew install mobile-shell)  this can be used instead of ssh for remote servers and won’t disconnect you when you move your laptop between networks.
- git  (already installed or use brew install git)  use git for all the code.  You can use the command line or there are GUI tools (http://www.sourcetreeapp.com/ or https://mac.github.com).  Here’s a quick tutorial: https://try.github.io 
GitHub Here is a quick-start guide to git that will get you up and running: http://rogerdudler.github.io/git-guide/
GitHub (https://github.com/dali-lab) get an account on this. 
- [tmux](https://tmux.github.io/): It lets you switch easily between several programs in one terminal, detach them (they keep running in the background) and reattach them to a different terminal

## Developer Environments and Editors:
- Atom  (http://atom.io)  I personally like this better as a text/code editor than Sublime (http://www.sublimetext.com/) but both are really nice
- IntelliJ  (http://www.jetbrains.com/idea/download/)  Best developer environment out there, supports Java/Javascript/Node/Ruby/Rails/Python/Less/SASS.  We have a free license -- email tim@dali for an invite.
- Fenix  (http://fenixwebserver.com)  Simple little webserver app to run multiple local static file/js testing http servers.
- MAMP  (http://www.mamp.info/en/)  Mysql/Apache/PHP for OSX for say running Wordpress.  (We’re trying to move away from Wordpress in general but sometimes its the best solution.)

## Frameworks and Services:
- Parse  (http://www.parse.com) backend as a service with SDK’s for javascript/node/iOS/etc.  Very convenient and fast for rapid prototyping. Just build the frontend and let Parse do the backend for you.  The javascript parse sdk is built on top of Backbone.js so you have a great frontend framework built-in. 

## Starter Projects:

- Parse/Backbone/Express starter project: https://github.com/dali-lab/ParseStarterApp 
the stack for this is: Parse/Backbone, Express, Facebook, jQuery, Bootstrap
sample app includes:
facebook integration (login and document sharing)
user login and profiles
creating and saving documents to backend
full text search of documents

- Expressjs/Mongo/React starter project:   https://github.com/dali-lab/dali-seed 
the stack for this is: Express, Mongo, React, Bootstrap
sample app includes:
user login


## Additional Tools:
- Git Autocomplete: Being able to git checkout <TAB> for branches
https://github.com/bobthecow/git-flow-completion/wiki/Install-Bash-git-completion

## Useful Atom Packages:
- autocomplete-plus: autocompletes while typing
- highlight-line: highlights the current line you're on
- emmet: scaffolding HTML and CSS
- conflicts: helps fix merge conflicts
- atom-lint: easy integration with linters, such as flake8 or jslint
- color-picker: right click on a color
- pigments: displays colors in projects and files
- minimap: code map for quick scroll
- highlight-selected: When you select a keyword or variable all other instances are shown. 
