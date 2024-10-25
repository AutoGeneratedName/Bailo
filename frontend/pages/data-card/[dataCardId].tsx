import { useGetModel } from 'actions/model'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs, { PageTab } from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import Overview from 'src/entry/overview/Overview'
import Settings from 'src/entry/settings/Settings'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { EntryKind } from 'types/types'
import { getCurrentUserRoles, getRequiredRolesText, hasRole } from 'utils/roles'

export default function DataCard() {
  const router = useRouter()
  const { dataCardId }: { dataCardId?: string } = router.query
  const {
    model: dataCard,
    isModelLoading: isDataCardLoading,
    isModelError: isDataCardError,
  } = useGetModel(dataCardId, EntryKind.DATA_CARD)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const currentUserRoles = useMemo(() => getCurrentUserRoles(dataCard, currentUser), [dataCard, currentUser])

  const [isReadOnly, requiredRolesText] = useMemo(() => {
    const validRoles = ['owner']
    return [!hasRole(currentUserRoles, validRoles), getRequiredRolesText(currentUserRoles, validRoles)]
  }, [currentUserRoles])

  const tabs: PageTab[] = useMemo(
    () =>
      dataCard
        ? [
            {
              title: 'Overview',
              path: 'overview',
              view: <Overview entry={dataCard} currentUserRoles={currentUserRoles} />,
            },
            {
              title: 'Settings',
              path: 'settings',
              disabled: isReadOnly,
              disabledText: requiredRolesText,
              view: <Settings entry={dataCard} currentUserRoles={currentUserRoles} />,
            },
          ]
        : [],
    [currentUserRoles, dataCard, isReadOnly, requiredRolesText],
  )

  const error = MultipleErrorWrapper(`Unable to load data card page`, {
    isDataCardError,
    isCurrentUserError,
  })
  if (error) return error

  return (
    <>
      <Title text={dataCard ? dataCard.name : 'Loading...'} />
      {(isDataCardLoading || isCurrentUserLoading) && <Loading />}
      {dataCard && (
        <PageWithTabs
          title={dataCard.name}
          subheading={`ID: ${dataCard.id}`}
          tabs={tabs}
          requiredUrlParams={{ dataCardId: dataCard.id }}
          titleToCopy={dataCard.name}
          subheadingToCopy={dataCard.id}
        />
      )}
    </>
  )
}
