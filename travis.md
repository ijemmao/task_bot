## Guide to setting up TravisCI, linters, and githooks for your Github Repo

#### Motivations

###### TravisCI

TravisCI is a continuous integration system that allows you to easily test and delopy code on the fly. We will be using TravisCI to integrate automatic linting and unit testing within our GitHub repository. More information about TravisCI can be found (here)[https://travis-ci.com/].

###### Linters

Linters are code parsers that check your code for syntax errors, common style mistakes, and makes sure that your code falls under best practices. Linters help save time, detect bugs, and improve code quality. Linters exist for all types of languages and even markdown such as HTML, CSS, and JSON. Linters are especially helpful for detecting syntax errors while using lightweight code editors such as Atom or Sublime Text that doesn't have that built in functionality of IDEs such as IntelliJ or Pycharm.

#### Setup

1. As an admin for your GitHub repo, sign up for a [Travis-CI account](https://travis-ci.org/auth)

2. Once you’re signed in, and we’ve synchronized your repositories from GitHub, go to your [profile page](https://travis-ci.org/profile/) and enable Travis CI builds for your repository.

  ![profile](/imgs/travis-ci.jpg)

3. Create a `.travis.yml` file in your home directory. This is the configuration file that Travis uses. You can read more about detailed configurations [here](https://docs.travis-ci.com/user/customizing-the-build/). Below is a sample configuration file that we are using for a Meteor project. By default, `node_js` configurations will run `npm test` after the build completes.

    ```
    language: node_js
    node_js:
      - "5.4"
    ```

4. After you are finished setting up your `.travis.yml`, simply push your changes to GitHub

    ```
    git add -A
    git commit -m 'Travis CI Config'
    git push
    ```

5. Turn on GitHub Protected Branch.

  You want to set up protected branches for your GitHub repository to ensure that all required CI tests are passing before collaborators can make changes to a protected branch. This will prevent potentially buggy code from being merged into master. To do so simply visit `https://github.com/<team>/<repo>/settings/branches` and turn on protected branch for `master`.

  ![protected-branch](/imgs/protected-branch.jpg)

 After setting this up, click the `edit` button for more configuration options and make sure to check the `Require status checks to pass before merging` button.

 ![status](/imgs/check-status.png)

6. Setting up a linter for your project

  I highly recommend setting up a linter plugin for your text editor of choice in addition to your linter. One that works well for atom is [Linter](https://atomlinter.github.io/). You can install specific linters for your selected language and the linter will display inline errors.

  ![linter error](/imgs/linter-error.png)

  Each specific linter has different installation methods. For instance you can install `eslint` using `npm install eslint`

7. Pre-commit Hooks

  In addition to running server side testing through Travis CI, you can also set up pre-commit hooks locally in your git repository.

  Pre-commit hooks will typically run all of your linters against any files that you are attempting to stage. If there are any linter errors, you must fix errors before successfully committing.

  You can use a simple script and add it to your `.git/hooks/pre-commit` file. A sample script for eslint can be found [here](https://gist.github.com/linhmtran168/2286aeafe747e78f53bf).

  Alternatively if you don't feel comfortable doing this yourself, you can use a third party git hook manager such as [Overcommit](https://github.com/brigade/overcommit), [Pre-commit](https://github.com/pre-commit/pre-commit), or [Git-hooks](https://www.npmjs.com/package/git-hooks)
