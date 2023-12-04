import express from 'express';

const AdminRouter = express.Router();

import { loginAsAdmin,filterBadWords,getAllPosts,getAllUsers,deletePost,deleteUser} from '../controllers/adminController.js';


AdminRouter.post('/filter', filterBadWords);
AdminRouter.post('/login', loginAsAdmin);
AdminRouter.get('/users', getAllUsers);
AdminRouter.get('/posts', getAllPosts);
AdminRouter.delete('/user/:id', deleteUser);
AdminRouter.delete('/block/post', deletePost);
AdminRouter.delete('/block/user', deleteUser);



export default AdminRouter;
