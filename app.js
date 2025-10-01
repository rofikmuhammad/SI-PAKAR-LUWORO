const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const pdfkit = require('pdfkit');
const excel = require('exceljs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const dataDir = __dirname + '/data';
const load = (f)=> fs.readJsonSync(dataDir+'/'+f,{throws:false})||[];
const save = (f,d)=> fs.writeJsonSync(dataDir+'/'+f,d,{spaces:2});

function auth(role){
  return (req,res,next)=>{
    const token=req.headers['authorization']?.split(' ')[1]||req.query.token;
    if(!token) return res.status(401).json({error:'No token'});
    const users=load('users.json');
    const user=users.find(u=>u.username===token);
    if(!user) return res.status(401).json({error:'Invalid token'});
    if(role && user.role!==role) return res.status(403).json({error:'Forbidden'});
    req.user=user; next();
  }
}

app.post('/api/login',(req,res)=>{
  const {username,password}=req.body;
  const users=load('users.json');
  const user=users.find(u=>u.username===username && u.password===password);
  if(!user) return res.json({error:'Invalid'});
  res.json({token:user.username, role:user.role, name:user.name});
});

app.post('/api/checkin',auth('staff'),(req,res)=>{
  const attendance=load('attendance.json');
  const date=new Date().toISOString().slice(0,10);
  let rec=attendance.find(a=>a.userId===req.user.id && a.date===date);
  if(!rec){ rec={id:Date.now(), userId:req.user.id, date, checkIn:new Date().toISOString(), checkInLoc:`${req.body.lat},${req.body.lng}`}; attendance.push(rec); }
  save('attendance.json',attendance);
  res.json(rec);
});

app.post('/api/checkout',auth('staff'),(req,res)=>{
  const attendance=load('attendance.json');
  const date=new Date().toISOString().slice(0,10);
  let rec=attendance.find(a=>a.userId===req.user.id && a.date===date);
  if(rec){ rec.checkOut=new Date().toISOString(); rec.checkOutLoc=`${req.body.lat},${req.body.lng}`; }
  save('attendance.json',attendance);
  res.json(rec);
});

app.post('/api/report',auth('staff'),(req,res)=>{
  const reports=load('reports.json');
  const rec={id:Date.now(),userId:req.user.id,date:new Date().toISOString().slice(0,10),notes:req.body.notes,photoUrl:req.body.photoUrl};
  reports.push(rec); save('reports.json',reports); res.json(rec);
});

app.get('/api/myAttendance',auth('staff'),(req,res)=>{
  const data=load('attendance.json').filter(a=>a.userId===req.user.id); res.json(data);
});
app.get('/api/myReports',auth('staff'),(req,res)=>{
  const data=load('reports.json').filter(r=>r.userId===req.user.id); res.json(data);
});

app.get('/api/allAttendance',auth('admin'),(req,res)=>{
  const users=load('users.json'); let data=load('attendance.json');
  if(req.query.month) data=data.filter(a=>a.date.startsWith(req.query.month));
  res.json(data.map(a=>({...a,name:users.find(u=>u.id===a.userId)?.name})));
});
app.get('/api/allReports',auth('admin'),(req,res)=>{
  const users=load('users.json'); let data=load('reports.json');
  if(req.query.month) data=data.filter(r=>r.date.startsWith(req.query.month));
  res.json(data.map(r=>({...r,name:users.find(u=>u.id===r.userId)?.name})));
});

app.get('/api/export/excel',auth('admin'),async (req,res)=>{
  const users=load('users.json'); let att=load('attendance.json'); let rep=load('reports.json');
  if(req.query.month){ att=att.filter(a=>a.date.startsWith(req.query.month)); rep=rep.filter(r=>r.date.startsWith(req.query.month)); }
  const wb=new excel.Workbook(); const ws=wb.addWorksheet('Attendance');
  ws.addRow(['Staff','Date','CheckIn','CheckInLoc','CheckOut','CheckOutLoc']);
  att.forEach(a=>{const u=users.find(x=>x.id===a.userId); ws.addRow([u?.name,a.date,a.checkIn,a.checkInLoc,a.checkOut,a.checkOutLoc]);});
  const ws2=wb.addWorksheet('Reports');
  ws2.addRow(['Staff','Date','Notes','Photo']);
  rep.forEach(r=>{const u=users.find(x=>x.id===r.userId); ws2.addRow([u?.name,r.date,r.notes,r.photoUrl]);});
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition','attachment; filename=attendance.xlsx');
  await wb.xlsx.write(res); res.end();
});

app.get('/api/export/pdf',auth('admin'),(req,res)=>{
  const users=load('users.json'); let att=load('attendance.json'); let rep=load('reports.json');
  if(req.query.month){ att=att.filter(a=>a.date.startsWith(req.query.month)); rep=rep.filter(r=>r.date.startsWith(req.query.month)); }
  const doc=new pdfkit(); res.setHeader('Content-Type','application/pdf'); res.setHeader('Content-Disposition','attachment; filename=attendance.pdf'); doc.pipe(res);
  doc.fontSize(16).text('Attendance Records',{underline:true});
  att.forEach(a=>{const u=users.find(x=>x.id===a.userId); doc.fontSize(12).text(`${u?.name} | ${a.date} | In:${a.checkIn}@${a.checkInLoc} | Out:${a.checkOut}@${a.checkOutLoc}`);});
  doc.moveDown(); doc.fontSize(16).text('Performance Reports',{underline:true});
  rep.forEach(r=>{const u=users.find(x=>x.id===r.userId); doc.fontSize(12).text(`${u?.name} | ${r.date} | Notes:${r.notes} | Photo:${r.photoUrl}`);});
  doc.end();
});

const PORT=process.env.PORT||10000;
app.listen(PORT,()=>console.log('Server running on '+PORT));
