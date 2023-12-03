function hsv2rgb(h,s,v) 
{                              
  let f= (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);     
  return (f(1)*255)+((f(3)*255)<<8)+((f(5)*255)<<16);//[f(5),f(3),f(1)];       
}   

