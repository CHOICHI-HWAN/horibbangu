'use strict';
const fs=require('node:fs'),esbuild=require('esbuild');
const mode=process.argv[2],input=process.argv[3],output=process.argv[4];
function compile(source,platform='browser'){
 return esbuild.transformSync(source,{loader:'js',target:platform==='node'?'node22':'es2020',platform,
  minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:true,legalComments:'none',charset:'utf8'}).code.replace(/<\/script/gi,'<\\/script');
}
const source=fs.readFileSync(input,'utf8');let result;
if(mode==='html')result=source.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,(all,open,script,close)=>/\bsrc\s*=/i.test(open)||!script.trim()?all:open+compile(script)+close);
else result=compile(source,mode==='node'?'node':'browser');
fs.writeFileSync(output,result);
