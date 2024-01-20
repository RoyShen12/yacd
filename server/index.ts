import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { MongoClient } from 'mongodb';

const app = express()
  .use(express.json({ limit: '128mb' }))
  .use(helmet())
  .use(compression());

const secret = process.argv[2];
const mongo = process.argv[3];

interface DataWithId {
  id: string | number;
}

const s = Buffer.from(secret, 'hex').toString('utf-8');

const client = new MongoClient(`mongodb://${mongo}/`, {
  retryWrites: true,
  serverSelectionTimeoutMS: 1000,
  connectTimeoutMS: 1000,
  authSource: 'admin',
  authMechanism: 'SCRAM-SHA-256',
});

client.connect().then(
  () => {
    console.log('mongo connect success');

    // client.on('connectionPoolCleared', () => {
    //   client.connect()
    // })

    client.on('error', (err) => {
      console.error(new Date().toLocaleString(), 'mongo on error');
      console.error(err);
      console.error(new Date().toLocaleString(), 'try reconnect');
      client.connect();
    });
  },
  (err) => {
    console.error('mongo connect failed');
    console.error(err);
    process.exit(-1);
  },
);

const PersistentKey = 'yacd.closedConns';

app.use((req, res, next) => {
  if (req.headers['x-yacd-auth'] !== s) return res.status(401).json({});

  next();
});

app.get('/get/:key', async (req, res) => {
  if (req.params.key !== PersistentKey) return res.status(404).json({});

  const [data, length] = await Promise.all([
    client.db('openclash').collection('connections').find({}).sort('id').limit(1000).toArray(),
    client.db('openclash').collection('connections').countDocuments({}),
  ]);
  return res.json(data ? { data, length } : null);
});

app.post('/set/:key', async (req, res) => {
  if (req.params.key !== PersistentKey) return res.status(404).json({});

  const collection = client.db('openclash').collection('connections');

  // let total = req.body.length;
  // console.log(`req.body.length ${total}`)
  /* const ret = */ await Promise.all(
    (req.body as DataWithId[]).map((d) =>
      collection.updateOne({ id: d.id }, { $setOnInsert: d }, { upsert: true }),
    ),
  );
  // const ret = await collection.bulkWrite(
  //   req.body.map(d => ({
  //     updateOne: {
  //       filter: { id: d.id },
  //       update: { $setOnInsert: d },
  //       upsert: true,
  //     },
  //   }))
  // )
  // const newData = new DataModel({ key, data: req.body.data })
  // await newData.save()

  // console.log(`Data saved successfully!`)

  // console.log(
  //   ret.reduce(
  //     (p, c) => {
  //       p.modifiedCount += c.modifiedCount;
  //       p.upsertedCount += c.upsertedCount;
  //       p.matchedCount += c.matchedCount;
  //       return p;
  //     },
  //     { modifiedCount: 0, upsertedCount: 0, matchedCount: 0 },
  //   ),
  // );
  return res.json({ message: `suc` });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
