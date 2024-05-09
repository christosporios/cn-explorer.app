import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getStatsRL, formatNumber } from './utils'
import { Anchor, Box, Footer, Grommet, Header, Heading, Main, Text } from 'grommet';
import { Analytics } from 'grommet-icons'
import { DateTime } from '@/components/DateTime';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Community Notes Data Explorer',
  description: 'Explore the data from Twitter\'s Community Notes',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const dbStats = await getStatsRL();

  return (
    <html lang="en">
      <body className="h-screen bg-white">
        <Grommet plain>
          <Header pad="small" background="brand" sticky="scrollup">
            <Anchor href='/' color="default">
              <Heading level="1" margin="none" size="2xl">
                <Box direction="row" gap="small">
                  <Analytics size="medium" />
                  <Text>Community Notes Data Explorer
                  </Text>
                </Box>
              </Heading>
            </Anchor>
          </Header>
          <Main margin="">
            {children}
          </Main>
          <Footer background="brand" pad="small">
            <Text size="xsmall">Made by <Anchor href='https://twitter.com/christosporios'>@christosporios</Anchor></Text>
            <Box direction="column">
              <Text size="xsmall" weight="bolder" >Data from <Anchor href='https://twitter.com/i/communitynotes/download-data'>Twitter's Community Notes</Anchor></Text>
              <Text size="xsmall">{formatNumber(dbStats.countNotes)} notes, most recent <DateTime date={dbStats.lastNoteDate} /></Text>
              <Text size="xsmall">{formatNumber(dbStats.countRatings)} ratings, most recent <DateTime date={dbStats.lastRatingDate} /></Text>
              <Text size="xsmall">{formatNumber(dbStats.countUsers)} users</Text>


            </Box>
          </Footer>
        </Grommet>
      </body>
    </html >
  )
}
