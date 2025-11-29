import film from "/cuoixuyenbiengioi.png";
import film1 from "/matmado.png";
import film2 from "/doibanhocyeu.png";
import film3 from "/hocvienanhhung.png";
import film4 from "/dungbuongtay.png";
import film5 from "/aioantrongvuonxuan.png";
import film6 from "/tienggoicuaoanhon.png";
import film7 from "/vungdatbinguyenrua.png";
import film8 from "/thanduoc.png";
import film9 from "/vayhamtaidaibac.png";
import film10 from "/ngayxuacomotchuyentinh.png";
import film11 from "/elli.png";
import film12 from "/venom.png";
import film13 from "/codauhaomon.png";
import film14 from "/robot.png";
import film15 from "/caubecaheo.png";
import promo from "/promotion.png";
import event1 from "/event1.png";
import event2 from "/event2.png";
import event from "/event.jpg";
import event3 from "/event3.jpg";
import event4 from "/event4.png";
import promo1 from "/promo1.png"

export const nowShowing = [
  { title: "CƯỜI XUYÊN BIÊN GIỚI - T13", poster: film, genres: ["Hài"], date: "15/11/2024" },
  { title: "MẬT MÃ ĐỎ - T18", poster: film1, genres: ["Hành động"], date: "08/11/2024" },
  { title: "ĐÔI BẠN HỌC YÊU - T18", poster: film2, genres: ["Tình cảm"], date: "08/11/2024" },
  { title: "HỌC VIỆN ANH HÙNG: YOU'RE NEXT - K", poster: film3, genres: ["Hành động"], date: "08/11/2024" },
  { title: "ĐỪNG BUÔNG TAY - T18", poster: film4, genres: ["Kinh dị"], date: "08/11/2024" },
  { title: "AI OÁN VƯỜN TRƯỜNG - T18", poster: film5, genres: ["Kinh dị"], date: "08/11/2024" },
  { title: "TIẾNG GỌI CỦA OAN HỒN - T18", poster: film6, genres: ["Kinh dị"], date: "01/11/2024" },
  { title: "VÙNG ĐẤT BỊ NGUYỀN RỦA - T18", poster: film7, genres: ["Kinh dị"], date: "01/11/2024" },
  { title: "THẦN DƯỢC - T18", poster: film8, genres: ["Kinh dị"], date: "01/11/2024" },
  { title: "VÂY HÃM TẠI ĐÀI BẮC - T18", poster: film9, genres: ["Hành động"], date: "08/11/2024" },
  { title: "NGÀY XƯA CÓ MỘT CHUYỆN TÌNH - T16", poster: film10, genres: ["Tâm lý, tình cảm"], date: "28/10/2024" },
  { title: "ELLI VÀ BÍ ẨN CHIẾC TÀU MA - K (Lồng tiếng)", poster: film11, genres: ["Hoạt hình"], date: "25/10/2024" },
  { title: "VENOM: THE LAST DANCE - T13", poster: film12, genres: ["Khoa học viễn tưởng"], date: "25/10/2024" },
  { title: "CÔ DÂU HÀO MÔN - T18", poster: film13, genres: ["Tâm lý, tình cảm"], date: "18/10/2024" },
  { title: "ROBOT HOANG DÃ - P (Lồng tiếng)", poster: film14, genres: ["Khoa học viễn tưởng"], date: "11/10/2024" },
  { title: "CẬU BÉ CÁ HEO - P (Lồng tiếng)", poster: film15, genres: ["Hoạt hình"], date: "27/09/2024" },
];

export const comingSoon = [
  { title: "OZI: PHI VỤ RỪNG XANH", poster: film, genres: ["Hài"], date: "22/11/2024" },
  { title: "MUFASA: VUA SƯ TỬ", poster: film, genres: ["Hoạt hình"], date: "27/12/2024" },
  { title: "NHÍM SONIC 3", poster: film, genres: ["Hành động"], date: "14/02/2025" },
  { title: "OZI: PHI VỤ RỪNG XANH", poster: film, genres: ["Hài"], date: "22/11/2024" },
  { title: "MUFASA: VUA SƯ TỬ", poster: film, genres: ["Hoạt hình"], date: "27/12/2024" },
  { title: "NHÍM SONIC 3", poster: film, genres: ["Hành động"], date: "14/02/2025" },
  { title: "OZI: PHI VỤ RỪNG XANH", poster: film, genres: ["Hài"], date: "22/11/2024" },
  { title: "MUFASA: VUA SƯ TỬ", poster: film, genres: ["Hoạt hình"], date: "27/12/2024" },
  { title: "NHÍM SONIC 3", poster: film, genres: ["Hành động"], date: "14/02/2025" },
  { title: "OZI: PHI VỤ RỪNG XANH", poster: film, genres: ["Hài"], date: "22/11/2024" },
  { title: "MUFASA: VUA SƯ TỬ", poster: film, genres: ["Hoạt hình"], date: "27/12/2024" },
  { title: "NHÍM SONIC 3", poster: film, genres: ["Hành động"], date: "14/02/2025" },
];

export const promos = [
  { id: 1, img: promo1 },
  { id: 2, img: promo },
  { id: 3, img: promo },
];

export const events = [
  { 
    id: 1, 
    img: event1,
    title: "Tuần lễ phim Việt 2024",
    date: "12 - 18/12/2024",
    time: "19:00 - 21:30",
    location: "Trung tâm Chiếu phim Quốc gia",
    tag: "Sự kiện đặc biệt",
    description: "Chuỗi suất chiếu quy tụ 12 tác phẩm điện ảnh Việt cùng tọa đàm với đạo diễn trẻ."
  },
  { 
    id: 2, 
    img: event2,
    title: "Đêm nhạc phim quốc tế",
    date: "05/01/2025",
    time: "20:00",
    location: "Phòng hòa nhạc NCC",
    tag: "Âm nhạc",
    description: "Trải nghiệm lại những bản soundtrack kinh điển được trình diễn trực tiếp bởi dàn nhạc giao hưởng."
  },
  { 
    id: 3, 
    img: event,
    title: "Workshop làm phim ngắn",
    date: "20/12/2024",
    time: "08:30 - 17:00",
    location: "Studio S2 - NCC",
    tag: "Workshop",
    description: "Khóa học thực hành dành cho bạn trẻ yêu thích điện ảnh với sự hướng dẫn của các nhà làm phim độc lập."
  },
  { 
    id: 4, 
    img: event3,
    title: "Phiên chợ đạo cụ điện ảnh",
    date: "24/12/2024",
    time: "09:00 - 18:00",
    location: "Sảnh A - NCC",
    tag: "Trải nghiệm",
    description: "Không gian trưng bày và trao đổi đạo cụ, phục trang độc đáo từ các đoàn phim nổi tiếng."
  },
  { 
    id: 5, 
    img: event4,
    title: "Marathon Phim Marvel",
    date: "31/12/2024",
    time: "18:00 - 06:00",
    location: "Rạp 1 - NCC",
    tag: "Suất chiếu đặc biệt",
    description: "12 tiếng đồng hồ sống cùng các siêu anh hùng với combo vé và quà tặng độc quyền."
  },
  { 
    id: 6, 
    img: event,
    title: "Ngày hội cosplay điện ảnh",
    date: "10/01/2025",
    time: "15:00",
    location: "Quảng trường NCC",
    tag: "Cộng đồng",
    description: "Sân chơi hóa thân thành nhân vật yêu thích cùng mini game và giải thưởng giá trị."
  },
];

export const movies = [
  {
    title: "AI OÁN TRONG VƯỜN XUÂN - T18",
    origin: "Hàn Quốc",
    release: "08/11/2024",
    type: "T18",
    genre: "Kinh dị",
    duration: 91,
    img: "/aioantrongvuonxuan.png",
    times: ["18:15", "19:55", "23:25"],
  },
  {
    title: "MẬT MÃ ĐỎ - K - Phụ đề",
    origin: "Mỹ",
    release: "08/11/2024",
    type: "K",
    genre: "Hành động",
    duration: 120,
    img: "/matmado.png",
    times: ["18:25", "20:00", "20:35", "21:30", "22:10", "23:15"],
  },
  {
    title: "ĐÔI BẠN HỌC YÊU - T18",
    origin: "Hàn Quốc",
    release: "08/11/2024",
    type: "T18",
    genre: "Tâm lý, tình cảm",
    duration: 115,
    img: "/doibanhocyeu.png",
    times: ["18:15", "19:45", "20:30", "21:50", "22:20", "23:30"],
  },
  {
    title: "HỌC VIỆN ANH HÙNG: YOU'RE NEXT - K",
    origin: "Nhật Bản",
    release: "08/11/2024",
    type: "K",
    genre: "Hoạt hình",
    duration: 108,
    img: "/hocvienanhhung.png",
    times: ["20:20"],
  },
  {
    title: "ĐỪNG BUÔNG TAY - T18",
    origin: "Mỹ",
    release: "08/11/2024",
    type: "T18",
    genre: "Kinh dị",
    duration: 101,
    img: "/dungbuongtay.png",
    times: ["16:25"],
  },
  {
    title: "Tiếng gọi của oán hồn",
    origin: "Nhật Bản",
    release: "01/11/2024",
    type: "T18",
    genre: "Kinh dị",
    duration: 100,
    img: "/tienggoicuaoanhon.png",
    times: ["22:45"],
  },
  {
    title: "VÙNG ĐẤT BỊ NGUYỀN RỦA - T18",
    origin: "Thái Lan",
    release: "01/11/2024",
    type: "T18",
    genre: "Kinh dị",
    duration: 117,
    img: "/vungdatbinguyenrua.png",
    times: ["21:25", "23:30"],
  },
  {
    title: "THẦN DƯỢC - T18",
    origin: "Mỹ",
    release: "01/11/2024",
    type: "T18",
    genre: "Kinh dị",
    duration: 139,
    img: "/thanduoc.png",
    times: ["17:55", "22:10"],
  },
  {
    title: "VÂY HÃM TẠI ĐÀI BẮC - T18",
    origin: "Mỹ",
    release: "01/11/2024",
    type: "T18",
    genre: "Kinh dị",
    duration: 100,
    img: "/vayhamtaidaibac.png",
    times: ["21:35"],
  },
  {
    title: "NGÀY XƯA CÓ MỘT CHUYỆN TÌNH - T16",
    origin: "Việt Nam",
    release: "28/10/2024",
    type: "T16",
    genre: "Tâm lý tình cảm",
    duration: 135,
    img: "/ngayxuacomotchuyentinh.png",
    times: ["17:35", "18:35", "20:00", "21:00", "22:20"],
  },
  {
    title: "VENOM: THE LAST DANCE - T13",
    origin: "Mỹ",
    release: "25/10/2024",
    type: "T16",
    genre: "Khoa học viễn tưởng",
    duration: 100,
    img: "/venom.png",
    times: ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "22:55"],
  },
  {
    title: "ELLI VÀ BÍ ẨN CHIẾC TÀU MA -K - LỒNG TIẾNG",
    origin: "Đức",
    release: "25/10/2024",
    type: "K",
    genre: "Hoạt hình",
    duration: 86,
    img: "/elli.png",
    times: ["18:15"],
  },
  {
    title: "CÔ DÂU HÀO MÔN - T18",
    origin: "Việt Nam",
    release: "18/10/2024",
    type: "T18",
    genre: "Tâm lý tình cảm",
    duration: 114,
    img: "/codauhaomon.png",
    times: ["18:20", "20:25", "22:30"],
  },
  {
    title: "ROBOT HOANG DÃ - P - LỒNG TIẾNG",
    origin: "Mỹ",
    release: "11/10/2024",
    type: "P",
    genre: "Khoa học viễn tưởng",
    duration: 95,
    img: "/robot.png",
    times: ["20:25"],
  },
  {
    title: "CẬU BÉ CÁ HEO - P - LỒNG TIẾNG",
    origin: "Mỹ",
    release: "27/09/2024",
    type: "P",
    genre: "Hoạt hình",
    duration: 85,
    img: "/caubecaheo.png",
    times: ["19:50"],
  },
  {
    title: "ROBOT HOANG DÃ - P - LỒNG TIẾNG",
    origin: "Mỹ",
    release: "11/10/2024",
    type: "P",
    genre: "Khoa học viễn tưởng",
    duration: 95,
    img: "/robot.png",
    times: ["20:25"],
  },
];