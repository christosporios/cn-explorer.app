import { Table, TableBody, TableHead, TableHeaderCell, TableRow, Title } from "@tremor/react";

export default function Note({data} : {data: any[] }) {
    const cols : string[] = Object.keys(data[0]);
    console.log("GenericTable")
    return <Table>
        <Title>Results</Title>

        <TableHead>
            <TableRow>
                {cols.map((key, ind) => <TableHeaderCell key={`hc-${ind}`}>{key}</TableHeaderCell>)}
            </TableRow>
        </TableHead>
        <TableBody>
            {data.map((item, ind) => <TableRow key={`tr-${ind}`}>
                {cols.map((key, ind) => <td key={`td-${ind}`}>{item[key]}</td>)}
            </TableRow>
            )}
        </TableBody>
    </Table>
}