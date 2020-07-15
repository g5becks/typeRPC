/* eslint-disable @typescript-eslint/no-unused-vars */

type ClientHttpOption = 'axios' | 'fetch'
export const generateClient = async (tsConfigFilePath: string, outputPath: string, client: ClientHttpOption) => {

}

type ServerFrameWorkOption = 'express' | 'fastify' | 'koa'
export const generateServer = async (tsConfigFilePath: string, outputPath: string, serverFrameWork: ServerFrameWorkOption) => {

}
