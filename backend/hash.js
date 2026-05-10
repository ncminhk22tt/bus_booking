const bcrypt = require("bcryptjs")

const password = ""

bcrypt.hash(password, 10).then((hash) => {
  console.log("Hashed password:")
  // console.log(hash)
  console.log(Buffer.from(hash).toString("hex"))
})
