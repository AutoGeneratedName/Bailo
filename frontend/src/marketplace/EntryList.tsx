import { Box, Link as MuiLink, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import Link from 'next/link'
import { Fragment, useMemo } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import EmptyBlob from 'src/common/EmptyBlob'
import MessageAlert from 'src/MessageAlert'

interface EntryListProps {
  entries: EntrySearchResult[]
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  entriesErrorMessage?: string
}

export default function EntryList({
  entries,
  selectedChips,
  onSelectedChipsChange,
  entriesErrorMessage,
}: EntryListProps) {
  const theme = useTheme()

  const entriesDisplay = useMemo(() => {
    return entries.map((entry, index) => (
      <Fragment key={entry.id}>
        <Stack direction='row'>
          <Link style={{ textDecoration: 'none' }} href={`${entry.kind}/${entry.id}`} passHref>
            <MuiLink variant='h5' sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.primary.main }}>
              {entry.name}
            </MuiLink>
          </Link>
        </Stack>
        <Typography variant='body1' sx={{ marginBottom: 2 }}>
          {entry.description}
        </Typography>
        <ChipSelector
          chipTooltipTitle={'Filter by tag'}
          options={entry.tags.slice(0, 10)}
          expandThreshold={10}
          multiple
          selectedChips={selectedChips}
          onChange={onSelectedChipsChange}
          size='small'
          ariaLabel='add tag to search filter'
        />
        {index !== entries.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }} />}
      </Fragment>
    ))
  }, [entries, onSelectedChipsChange, selectedChips, theme.palette.primary.main])

  if (entriesErrorMessage) return <MessageAlert message={entriesErrorMessage} severity='error' />

  return (
    <>
      {entries.length === 0 && <EmptyBlob data-test='emptyEntryListBlob' text='No entries here' />}
      {entriesDisplay}
    </>
  )
}
