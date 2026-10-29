// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // a new feature
        "fix", // a bug fix
        "docs", // documentation only changes
        "style", // formatting, missing semicolons, etc.
        "refactor", // code change that neither fixes a bug nor adds a feature
        "perf", // performance improvement
        "test", // adding or fixing tests
        "build", // changes that affect the build system or external dependencies
        "ci", // CI/CD configuration files and scripts
        "chore", // other changes that don't modify src or test files
        "revert", // revert a previous commit
      ],
    ],
    "subject-case": [
      2,
      "never",
      ["sentence-case", "start-case", "pascal-case"],
    ],
  },
};
