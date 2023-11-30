import BadWordsFilter from 'bad-words';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
const filter = new BadWordsFilter();


/// filter bad words
export const filterBadWords = async(req,res)=>{
    try {
      const { text } = req.body;
      const hasOffensiveWords = filter.isProfane(text);
  
      console.log("hasOffensiveWords", hasOffensiveWords);
    
      if (hasOffensiveWords) {
        res.status(200).json({ containsOffensiveWords: true });
      } else {
        res.status(200).json({ containsOffensiveWords: false });
      }
    } catch (err) {
       return res.status(500).json({
        message: err.message
    });
    } 
};

/// get all users
export const getAllUsers = async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json( users);
    } catch (err) {
      return res.status(500).json({
        message: err.message,
      });
    }
};
  

/// delete a user
export const deleteUser = async (req, res) => {
    try {
      let deleteUser = await User.findOneAndUpdate(
        { _id: req.params.id },
        { isDeleted: true },
        { new: true }
      );
      if (!deleteUser) throw new Error("User not found");
     return res
        .status(200)
        .json({ message: "User deleted successfully", data: deleteUser });
    } catch (err) {
      return res.status(500).json({
        message: err.message,
      });
    }
};


/// get all posts

export const getAllPosts = async (req, res) => {
    try {
      const posts = await Post.find();
      res.status(200).json(posts);
    } catch (err) {
      return res.status(500).json({
        message: err.message,
      });
    }
}
  
  
  
  