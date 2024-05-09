import { Anchor, Box, Button, Text, Tip } from "grommet";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)

export function DateTime({ date }: { date: Date }) {
    const timeAgo = new TimeAgo('en-US')
    return <Tip content={
        <Box background="white" pad="xsmall" border={{ color: "black", size: "small" }}>
            <Text size="xsmall">{date.toISOString()}</Text>
        </Box>
    }>
        <Button plain>
            <Anchor>{timeAgo.format(date)}</Anchor>
        </Button>
    </Tip>
}