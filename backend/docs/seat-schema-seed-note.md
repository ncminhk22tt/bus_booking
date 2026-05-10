# Seat Schema + Seed (Theo Prompt)

## Cấu trúc dữ liệu ghế trả về API

```json
{
  "id": 1,
  "seat_number": "A1",
  "floor": 1,
  "row": 1,
  "column": 1,
  "type": "Standard",
  "status": "Available",
  "price": 250000,
  "busType": "Xe Giuong Nam 36 Cho"
}
```

## Script seed

- `node scripts/seed_seat_layouts.js`
- Tạo dữ liệu mẫu:
  - Xe Giuong Nam 36 Cho
  - Xe Limousine 22 Phong

Console log tiếng Việt (ASCII):
- Dang tao du lieu mau so do ghe...
- Da tao xong so do ghe
- Con trong: ... ghe
