import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from "./routes/authRoutes.js";
import schedulesRoutes from "./routes/schedulesRoutes.js";
import yearSemesterRoutes from "./routes/yearSemesterRoutes.js";
import campusRoutes from "./routes/campusRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/notes', noteRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/year-semester", yearSemesterRoutes);
app.use("/api/campuses", campusRoutes);
app.use("/api/expenses", expenseRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('Chao mung den voi unihub (phan backend)');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://192.168.1.41:${PORT}`);
});

// Nếu ở nhà thì dùng IP = '192.168.1.41';
// Nếu ra ngoài thì dùng IP = '10.0.2.2' để trỏ vào localhost
export default app;
