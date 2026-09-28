# Code Review Process

All changes to the BookLooky Official LRS Rater go through a structured review before being merged.

## Process

1. **Create a Pull Request**  
   - Fork the repository and submit changes via a PR.
   - Provide a clear description of what was changed and why.

2. **Automated Checks**  
   - GitHub Actions runs install, `npm audit`, build, and tests on Node.js 18, 20, and 22.

3. **Review**  
   - All pull requests are reviewed by Jon Penneman (Project Lead) or a designated maintainer.
   - Review criteria:
     - Code quality and readability
     - Adherence to existing architecture and rating rules
     - No changes to core LRS methodology without explicit approval
     - Tests/documentation updated where relevant
     - Security and performance impact considered

4. **Approval & Merge**  
   - Final approval is given by Jon Penneman.
   - Once approved, the PR is merged into the main branch.

## Notes
- Small documentation or typo fixes may be fast-tracked.
- Contributors are encouraged to discuss larger changes first via GitHub Issues.
- The goal is to maintain high quality while keeping the process lightweight and founder-directed at this stage.

This process will evolve as the contributor community grows.

Last updated: September 2026