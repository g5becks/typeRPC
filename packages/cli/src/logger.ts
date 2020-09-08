import pino from 'pino'
import { Project } from 'ts-morph'

export const logger = (project: Project) =>
    pino(
        { level: 'error', prettyPrint: true },
        pino.destination({ dest: project.getRootDirectories()[0].getPath() + '/.typerpc/error.log', sync: false }),
    )
