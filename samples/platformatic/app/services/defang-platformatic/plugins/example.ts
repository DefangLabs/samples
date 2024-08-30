/// <reference path="../global.d.ts" />
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.log.info('Starting example plugin')
  fastify.decorate('example', 'foobar')
  fastify.log.info('Example plugin completed')
}
