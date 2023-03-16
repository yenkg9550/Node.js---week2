const http = require("http");
const dotenv = require("dotenv");
const mongoose = require('mongoose');
const headers = require('./headers');
const handleSuccess = require('./handleSuccess');
const handleError = require('./handleError');
const posts = require('./model/posts');

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log('資料庫連接成功'));

const reqListener = async(req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  })
  if (req.url === '/posts' && req.method === 'GET') {
    const allPosts = await posts.find();
    handleSuccess(res, allPosts);
    res.end();
  } else if(req.url=="/posts" && req.method == "POST") {
    req.on('end', async() => {
      try {
        const data = JSON.parse(body);
        if(data.content !== undefined) {
          const newPost = await posts.create(
            {
              name: data.name,
              content: data.content,
              tags: data.tags,
              type: data.type
            }
          );
          handleSuccess(res, newPost);  
        } else {
          handleError(res);
        }
      } catch(error) {
        handleError(res, error);
      }
    })
} else if (req.url === '/posts' && req.method === 'DELETE') {
  const deletePosts = await posts.deleteMany({});
  handleSuccess(res, deletePosts);
} else if (req.url.startsWith('/posts/') && req.method === 'DELETE') {
  try {
    const id = req.url.split('/').pop();
    await posts.findByIdAndDelete(id);
    handleSuccess(res, null);
  } catch (err) {
    handleError(res, err);
  } 
} else if (req.url.startsWith('/posts/') && req.method === 'PATCH') {
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const id = req.url.split('/').pop();
      if (data.content) {
        const editContent = {
          content: data.content,
        };
        const editPost = await posts.findByIdAndUpdate(id, editContent);
        handleSuccess(res, editPost);
      } else {
        handleError(res);
      }
    } catch (err) {
      handleError(res, err);
    }
  })
} else if(req.method == "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(JSON.stringify({
      "status": "錯誤",
      "message": "無此網站路由"
    }))
    res.end();
  }
}

const server = http.createServer(reqListener);
server.listen(process.env.PORT || 3005)