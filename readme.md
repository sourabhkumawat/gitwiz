# GitWiz

GitWiz is a CLI wrapper for Git commands using `simple-git` and `yargs`. It simplifies common Git operations with an easy-to-use command-line interface.

## Installation

To install GitWiz globally, run:

```sh
npm install -g gitwiz
```

## Usage

### Clone a repository

```sh
gitwiz clone <repoUrl> <localPath>
```

-   `repoUrl`: The URL of the repository you want to clone.
-   `localPath`: The local path where the repository will be cloned.

### Commit changes

```sh
gitwiz commit <message>
```

-   `message`: The commit message describing the changes.

### Push changes

```sh
gitwiz push
```

Pushes the committed changes to the remote repository.

### Pull changes

```sh
gitwiz pull
```

Pulls the latest changes from the remote repository.

## Examples

### Cloning a repository

```sh
gitwiz clone https://github.com/username/repo.git ./local-repo
```

### Committing changes

```sh
gitwiz commit "Initial commit"
```

### Pushing changes

```sh
gitwiz push
```

### Pulling changes

```sh
gitwiz pull
```

## Author

Your Name

## License

ISC

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or suggestions.

## Acknowledgements

This tool uses the following libraries:

-   [simple-git](https://github.com/steveukx/git-js)
-   [yargs](https://github.com/yargs/yargs)
