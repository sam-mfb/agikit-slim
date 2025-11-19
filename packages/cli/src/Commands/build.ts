import { Project, ProjectBuilder } from '@agikit-slim/core';
import { CLILogger } from '../CLILogger';

export function buildProject(basePath: string, encoding?: string) {
  const project = new Project(basePath);
  const builder = new ProjectBuilder(project, new CLILogger(), encoding);
  builder.buildProject();
}
