import express from 'express';

const AdminRouter = express.Router();

import { filterBadWords,deleteUser,getAllPosts,getAllUsers} from '../controllers/adminController.js';


AdminRouter.post('/filter', filterBadWords);
AdminRouter.get('/users', getAllUsers);
AdminRouter.get('/posts', getAllPosts);
AdminRouter.delete('/user/:id', deleteUser);



export default AdminRouter;
