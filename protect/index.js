var jwt = require("jsonwebtoken");

module.exports={
    eAdmin: async(req,res,next)=>{

     let token = req.headers["authorization"];

     if(!token){
        return res.status(401).json({
            msg: " no token "
        });
     }

     token = req.headers["authorization"].replace("Bearer ", "");

     if (blacklist[token]){
        return res.status(403).json({ message: "Invalid token." });
     } 

    try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);

       if (!decoded) return res.status(403).json({ message: "Invalid token." });
 
       res.locals.token = decoded;
       
       return next();

   } catch (err) {

       return res.status(403).json({ message: err.message });

   }
 

   }
}