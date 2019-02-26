// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: true,
});

fastify.addContentTypeParser('*', (req, done) => {
  // done()
  let data = [];
  req.on('data', (chunk) => { data.push(chunk); });
  req.on('end', () => {
    // console.log(data)
    data = Buffer.concat(data);
    done(null, data);
  });
});

// require schema jsons
const patientsSchema = require('./config/schemas/patients_output_schema.json');
const studiesSchema = require('./config/schemas/studies_output_schema.json');
const seriesSchema = require('./config/schemas/series_output_schema.json');
const instancesSchema = require('./config/schemas/instances_output_schema.json');

// add schemas to fastify to use by id
fastify.addSchema(patientsSchema);
fastify.addSchema(studiesSchema);
fastify.addSchema(seriesSchema);
fastify.addSchema(instancesSchema);

// register CouchDB plugin we created
fastify.register(require('./plugins/CouchDB'), {
  url: 'http://localhost:5984',
});
// register routes
// this should be done after CouchDB plugin to be able to use the accessor methods
fastify.register(require('./routes/qido'));
fastify.register(require('./routes/wado'));
// fastify.register(require('./routes/stow'));
fastify.register(require('./routes/other'));

fastify.after(() => {
  // this enables basic authentication
  // disabling authentication for now
  // fastify.addHook('preHandler', fastify.basicAuth)

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      // request needs to have a querystring with a `name` parameter
      querystring: {
        name: { type: 'string' },
      },
      // the response needs to be an object with an `hello` property of type 'string'
      response: {
        200: {
          type: 'object',
          properties: {
            hello: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => (reply.send({ hello: 'world' })),
  });
});


// Run the server!
const start = async () => {
  try {
    await fastify.listen(5985, '0.0.0.0');
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
    fastify.checkCouchDBViews();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
