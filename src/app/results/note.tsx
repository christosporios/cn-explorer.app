import { Card } from "@tremor/react";

export default function Note({data} : {data: any}) {
    console.log(data);
    return <Card    className="hover:cursor-pointer hover:bg-slate-50"> 
        <p>{data.summary}</p>
    </Card>
}
