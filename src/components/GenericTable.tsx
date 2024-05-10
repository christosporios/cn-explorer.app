import { Box, Data, DataSummary, DataTable, DataTableColumns, Tab, Tabs, Text, Toolbar, Chart, calcs, DataChart } from "grommet";

export default function GenericTable({ data }: { data: any[] }) {
    const cols: string[] = Object.keys(data[0]);

    console.log(data);

    cols.forEach((c) => {
        data.forEach((d) => {
            // if it's a number, parse it
            if (!isNaN(d[c]) && d[c] !== "" && !(d[c] instanceof Date)) {
                d[c] = parseFloat(d[c]);
            }
        });
    });

    let getColumnFriendlyName = (key: string) => {
        if (key.startsWith("x_" || key.startsWith("y_"))) {
            return key.substring(2).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        } else {
            return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
    }

    let getColumnDefinition = (key: string) => {
        return {
            property: key,
            header: <Text>{getColumnFriendlyName(key)}</Text>,
            render: (datum: any) => {
                return datum[key] instanceof Date ? datum[key].toLocaleDateString() : datum[key] || "N/A";
            },
            sortable: true,
            search: true,
            pin: true

        }
    }

    return <Box width="full">
        <Tabs>
            <Tab title="Table">
                <Data
                    data={data}
                >
                    <DataSummary />
                    <Toolbar>
                        <DataTableColumns options={cols.map((c) => { return { label: getColumnFriendlyName(c), property: c } })} drop />
                    </Toolbar>
                    <DataTable
                        columns={cols.map(getColumnDefinition)}
                    />
                </Data>
            </Tab>
            <Tab title="Chart">
                <GenericChart data={data} cols={cols} />
            </Tab>
            <Tab title="JSON">
                <Box height="500px" background="background-back" pad="small" overflow="scroll">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </Box>
            </Tab>
        </Tabs>
    </Box>;
}

function GenericChart({ data, cols }: { data: any[], cols: string[] }) {

    let x_cols = cols.filter((c) => c.startsWith("x_"));
    let y_cols = cols.filter((c) => c.startsWith("y_"));

    if (x_cols.length === 0 || y_cols.length === 0 || x_cols.length > 1) {
        return <Text color="text-weak">
            The returned data can not be rendered in a chart.
        </Text>
    }

    const values = data.map((d) => d[y_cols[0]]);
    const { axis, bounds, pad, thickness } = calcs(values);
    console.log(data);
    console.log(x_cols);

    return <Box width="full" height="medium">
        <DataChart
            data={data}
            series={y_cols}
            axis={{
                x: {
                    property: x_cols[0],
                    granularity: 'medium'
                },
                y: {
                    property: y_cols[0],
                    granularity: 'medium'
                }

            }}
            guide={{
                x: { granularity: 'medium' },
                y: { granularity: 'medium' }
            }}
            legend
            size="fill"
        />
    </Box>
}
