require("dotenv").config()
const app = require("./app")

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  // Thêm http://localhost: trước PORT để terminal tạo link
  console.log(`Server đang chạy: http://localhost:${PORT}`)
})
