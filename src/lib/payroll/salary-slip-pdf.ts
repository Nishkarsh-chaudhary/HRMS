import "server-only";

export type SalarySlipPdfData={companyName:string;employeeName:string;employeeCode:string;periodStart:string;periodEnd:string;paymentDate:string;runNumber:string;gross:number;deductions:number;net:number;payableDays:number;lopDays:number;paymentReference:string|null};
const ascii=(value:string)=>value.normalize("NFKD").replace(/[^\x20-\x7E]/g,"");
const escapePdf=(value:string)=>ascii(value).replaceAll("\\","\\\\").replaceAll("(","\\(").replaceAll(")","\\)");
const inr=(value:number)=>`INR ${new Intl.NumberFormat("en-IN",{maximumFractionDigits:2,minimumFractionDigits:2}).format(value)}`;

export function buildSalarySlipPdf(data:SalarySlipPdfData){
  const lines:[string,string][]=[
    ["Company",data.companyName],["Employee",`${data.employeeName} (${data.employeeCode})`],["Payroll period",`${data.periodStart} to ${data.periodEnd}`],["Payment date",data.paymentDate],["Payroll run",data.runNumber],["Payable days",String(data.payableDays)],["Loss of pay days",String(data.lopDays)],["Gross earnings",inr(data.gross)],["Total deductions",inr(data.deductions)],["NET PAY",inr(data.net)],["Payment reference",data.paymentReference??"Not recorded"],
  ];
  const commands=["BT","/F1 20 Tf","1 0 0 1 50 790 Tm","(SALARY SLIP) Tj","/F1 11 Tf"];
  lines.forEach(([label,value],index)=>{const y=750-index*34;commands.push(`1 0 0 1 50 ${y} Tm`,`(${escapePdf(label)}) Tj`,`1 0 0 1 210 ${y} Tm`,`(${escapePdf(value)}) Tj`)});
  commands.push("1 0 0 1 50 330 Tm","(This is a system-generated salary slip.) Tj","ET");
  const stream=commands.join("\n");
  const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let pdf="%PDF-1.4\n";const offsets=[0];objects.forEach((object,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let index=1;index<=objects.length;index++)pdf+=`${String(offsets[index]).padStart(10,"0")} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

