export type ComponentType = "earning"|"employee_deduction"|"employer_contribution"|"reimbursement"|"informational";
export type CalculationMethod = "fixed"|"percentage_of_ctc"|"percentage_of_gross"|"percentage_of_component"|"percentage_of_components"|"balancing"|"manual";
export type SalaryComponentRule={id:string;code:string;name:string;type:ComponentType;method:CalculationMethod;fixedAmount?:number;percentage?:number;baseComponentCodes?:string[];minimumAmount?:number;maximumAmount?:number;prorate?:boolean;includeInGross?:boolean;includeInNet?:boolean;includeInCtc?:boolean;priority?:number;allowNegative?:boolean;allowEmployeeOverride?:boolean;showOnSalarySlip?:boolean};
export type SalaryCalculationInput={monthlyCtc:number;targetGross?:number;payableDays:number;divisor:number;components:SalaryComponentRule[];overrides?:Record<string,number>};
export type CalculatedComponent=SalaryComponentRule&{monthlyEligible:number;payableAmount:number;source:string};
export type SalaryCalculation={components:CalculatedComponent[];gross:number;deductions:number;employerContributions:number;reimbursements:number;net:number;ctc:number;trace:string[];errors:string[]};

const round=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
const clamp=(value:number,rule:SalaryComponentRule)=>Math.min(rule.maximumAmount??Infinity,Math.max(rule.minimumAmount??-Infinity,value));

/** Deterministic, side-effect-free salary calculator. Legacy structures can continue using monthly_fixed. */
export function calculateSalary(input:SalaryCalculationInput):SalaryCalculation{
  const ordered=[...input.components].sort((a,b)=>(a.priority??100)-(b.priority??100));
  const values=new Map<string,number>();const calculated:CalculatedComponent[]=[];const trace:string[]=[];const errors:string[]=[];
  const balancing=ordered.filter(item=>item.method==="balancing");if(balancing.length>1)errors.push("Only one balancing component is allowed in a salary structure.");
  const unresolved=new Set(ordered.map(item=>item.code));
  for(let pass=0;pass<=ordered.length&&unresolved.size;pass++)for(const rule of ordered){if(!unresolved.has(rule.code))continue;const bases=rule.baseComponentCodes??[];if(bases.some(code=>!values.has(code)))continue;
    let value=0;let source=rule.method.replaceAll("_"," ");const override=input.overrides?.[rule.code];
    if(override!==undefined){value=override;source="employee override"}
    else if(rule.method==="fixed"||rule.method==="manual")value=rule.fixedAmount??0;
    else if(rule.method==="percentage_of_ctc")value=input.monthlyCtc*(rule.percentage??0)/100;
    else if(rule.method==="percentage_of_component"||rule.method==="percentage_of_components")value=bases.reduce((sum,code)=>sum+(values.get(code)??0),0)*(rule.percentage??0)/100;
    else if(rule.method==="percentage_of_gross"){const knownGross=calculated.filter(item=>item.includeInGross).reduce((sum,item)=>sum+item.monthlyEligible,0);value=knownGross*(rule.percentage??0)/100}
    else if(rule.method==="balancing"){const target=rule.includeInCtc?input.monthlyCtc:(input.targetGross??input.monthlyCtc);const used=calculated.filter(item=>rule.includeInCtc?item.includeInCtc:item.includeInGross).reduce((sum,item)=>sum+item.monthlyEligible,0);value=target-used}
    value=round(clamp(value,rule));if(value<0&&!rule.allowNegative){errors.push(`${rule.name} cannot be negative.`);value=0}values.set(rule.code,value);unresolved.delete(rule.code);
    const payable=round(rule.prorate?value*Math.max(0,input.payableDays)/Math.max(1,input.divisor):value);calculated.push({...rule,monthlyEligible:value,payableAmount:payable,source});trace.push(`${rule.name}: ${source} = ${payable.toFixed(2)}`);
  }
  if(unresolved.size)errors.push(`Circular or missing component dependencies: ${[...unresolved].join(", ")}.`);
  const sum=(predicate:(item:CalculatedComponent)=>boolean)=>round(calculated.filter(predicate).reduce((total,item)=>total+item.payableAmount,0));
  const gross=sum(item=>item.type==="earning"&&item.includeInGross!==false);const deductions=sum(item=>item.type==="employee_deduction");const employerContributions=sum(item=>item.type==="employer_contribution");const reimbursements=sum(item=>item.type==="reimbursement");const net=round(gross-deductions+reimbursements);const ctc=sum(item=>item.includeInCtc===true);
  return{components:calculated,gross,deductions,employerContributions,reimbursements,net,ctc,trace,errors};
}
