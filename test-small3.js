async function load(){const files=['data/questions-1.txt'];const res=await Promise.all(files.map(f=>fetch(f,{cache:'no-cache'})));}
