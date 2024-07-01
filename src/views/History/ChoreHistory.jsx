import { Checklist, EventBusy, Timelapse } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  List,
  ListDivider,
  ListItem,
  ListItemContent,
  ListItemDecorator,
  Sheet,
  Typography,
} from '@mui/joy'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../../Config'
import { GetAllCircleMembers } from '../../utils/Fetcher'
import { Fetch } from '../../utils/TokenManager'

const ChoreHistory = () => {
  const [choreHistory, setChoresHistory] = useState([])
  const [userHistory, setUserHistory] = useState([])
  const [performers, setPerformers] = useState([])
  const [historyInfo, setHistoryInfo] = useState([])

  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const { choreId } = useParams()

  useEffect(() => {
    setIsLoading(true) // Start loading

    Promise.all([
      Fetch(`${API_URL}/chores/${choreId}/history`).then(res => res.json()),
      GetAllCircleMembers().then(res => res.json()),
    ])
      .then(([historyData, usersData]) => {
        setChoresHistory(historyData.res)

        const newUserChoreHistory = {}
        historyData.res.forEach(choreHistory => {
          const userId = choreHistory.completedBy
          newUserChoreHistory[userId] = (newUserChoreHistory[userId] || 0) + 1
        })
        setUserHistory(newUserChoreHistory)

        setPerformers(usersData.res)
        updateHistoryInfo(historyData.res, newUserChoreHistory, usersData.res)
      })
      .catch(error => {
        console.error('Error fetching data:', error)
        // Handle errors, e.g., show an error message to the user
      })
      .finally(() => {
        setIsLoading(false) // Finish loading
      })
  }, [choreId])

  const updateHistoryInfo = (histories, userHistories, performers) => {
    // average delay for task completaion from due date:

    const averageDelay =
      histories.reduce((acc, chore) => {
        if (chore.dueDate) {
          // Only consider chores with a due date
          return acc + moment(chore.completedAt).diff(chore.dueDate, 'hours')
        }
        return acc
      }, 0) / histories.length
    const averageDelayMoment = moment.duration(averageDelay, 'hours')
    const maximumDelay = histories.reduce((acc, chore) => {
      if (chore.dueDate) {
        // Only consider chores with a due date
        const delay = moment(chore.completedAt).diff(chore.dueDate, 'hours')
        return delay > acc ? delay : acc
      }
      return acc
    }, 0)

    const maxDelayMoment = moment.duration(maximumDelay, 'hours')

    // find max value in userHistories:
    const userCompletedByMost = Object.keys(userHistories).reduce((a, b) =>
      userHistories[a] > userHistories[b] ? a : b,
    )
    const userCompletedByLeast = Object.keys(userHistories).reduce((a, b) =>
      userHistories[a] < userHistories[b] ? a : b,
    )

    const historyInfo = [
      {
        icon: (
          <Avatar>
            <Checklist />
          </Avatar>
        ),
        text: `${histories.length} completed`,
        subtext: `${Object.keys(userHistories).length} users contributed`,
      },
      {
        icon: (
          <Avatar>
            <Timelapse />
          </Avatar>
        ),
        text: `Completed within ${moment
          .duration(averageDelayMoment)
          .humanize()}`,
        subtext: `Maximum delay was ${moment
          .duration(maxDelayMoment)
          .humanize()}`,
      },
      {
        icon: <Avatar></Avatar>,
        text: `${
          performers.find(p => p.userId === Number(userCompletedByMost))
            ?.displayName
        } completed most`,
        subtext: `${userHistories[userCompletedByMost]} time/s`,
      },
    ]
    if (userCompletedByLeast !== userCompletedByMost) {
      historyInfo.push({
        icon: (
          <Avatar>
            {
              performers.find(p => p.userId === userCompletedByLeast)
                ?.displayName
            }
          </Avatar>
        ),
        text: `${
          performers.find(p => p.userId === Number(userCompletedByLeast))
            .displayName
        } completed least`,
        subtext: `${userHistories[userCompletedByLeast]} time/s`,
      })
    }

    setHistoryInfo(historyInfo)
  }

  function formatTimeDifference(startDate, endDate) {
    const diffInMinutes = moment(startDate).diff(endDate, 'minutes')
    let timeValue = diffInMinutes
    let unit = 'minute'

    if (diffInMinutes >= 60) {
      const diffInHours = moment(startDate).diff(endDate, 'hours')
      timeValue = diffInHours
      unit = 'hour'

      if (diffInHours >= 24) {
        const diffInDays = moment(startDate).diff(endDate, 'days')
        timeValue = diffInDays
        unit = 'day'
      }
    }

    return `${timeValue} ${unit}${timeValue !== 1 ? 's' : ''}`
  }
  if (isLoading) {
    return <CircularProgress /> // Show loading indicator
  }
  if (!choreHistory.length) {
    return (
      <Container
        maxWidth='md'
        sx={{
          textAlign: 'center',
          display: 'flex',
          // make sure the content is centered vertically:
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: '50vh',
        }}
      >
        <EventBusy
          sx={{
            fontSize: '6rem',
            // color: 'text.disabled',
            mb: 1,
          }}
        />

        <Typography level='h3' gutterBottom>
          No History Yet
        </Typography>
        <Typography level='body1'>
          You haven't completed any tasks. Once you start finishing tasks,
          they'll show up here.
        </Typography>
        <Button variant='soft' sx={{ mt: 2 }}>
          <Link to='/my/chores'>Go back to chores</Link>
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth='md'>
      <Typography level='h3' mb={1.5}>
        Summary:
      </Typography>
      {/* <Sheet sx={{ mb: 1, borderRadius: 'sm', p: 2, boxShadow: 'md' }}>
        <ListItem sx={{ gap: 1.5 }}>
          <ListItemDecorator>
            <Avatar>
              <AccountCircle />
            </Avatar>
          </ListItemDecorator>
          <ListItemContent>
            <Typography level='body1' sx={{ fontWeight: 'md' }}>
              {choreHistory.length} completed
            </Typography>
            <Typography level='body2' color='text.tertiary'>
              {Object.keys(userHistory).length} users contributed
            </Typography>
          </ListItemContent>
        </ListItem>
      </Sheet> */}
      <Grid container>
        {historyInfo.map((info, index) => (
          <Grid key={index} item xs={12} sm={6}>
            <Sheet sx={{ mb: 1, borderRadius: 'sm', p: 2, boxShadow: 'md' }}>
              <ListItem sx={{ gap: 1.5 }}>
                <ListItemDecorator>{info.icon}</ListItemDecorator>
                <ListItemContent>
                  <Typography level='body1' sx={{ fontWeight: 'md' }}>
                    {info.text}
                  </Typography>
                  <Typography level='body1' color='text.tertiary'>
                    {info.subtext}
                  </Typography>
                </ListItemContent>
              </ListItem>
            </Sheet>
          </Grid>
        ))}
      </Grid>
      {/* User History Cards */}
      <Typography level='h3' my={1.5}>
        History:
      </Typography>
      <Box sx={{ borderRadius: 'sm', p: 2, boxShadow: 'md' }}>
        {/* Chore History List (Updated Style) */}

        <List sx={{ p: 0 }}>
          {choreHistory.map((chore, index) => (
            <>
              <ListItem sx={{ gap: 1.5, alignItems: 'flex-start' }}>
                {' '}
                {/* Adjusted spacing and alignment */}
                <ListItemDecorator>
                  <Avatar sx={{ mr: 1 }}>
                    {performers
                      .find(p => p.userId === chore.completedBy)
                      ?.displayName?.charAt(0) || '?'}
                  </Avatar>
                </ListItemDecorator>
                <ListItemContent sx={{ my: 0 }}>
                  {' '}
                  {/* Removed vertical margin */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography level='body1' sx={{ fontWeight: 'md' }}>
                      {moment(chore.completedAt).format('ddd MM/DD/yyyy HH:mm')}
                    </Typography>

                    <Chip>
                      {chore.dueDate && chore.completedAt > chore.dueDate
                        ? 'Late'
                        : 'On Time'}
                    </Chip>
                  </Box>
                  <Typography level='body2' color='text.tertiary'>
                    <Chip>
                      {
                        performers.find(p => p.userId === chore.completedBy)
                          ?.displayName
                      }
                    </Chip>{' '}
                    completed
                    {chore.completedBy !== chore.assignedTo && (
                      <>
                        {', '}
                        assigned to{' '}
                        <Chip>
                          {
                            performers.find(p => p.userId === chore.assignedTo)
                              ?.displayName
                          }
                        </Chip>
                      </>
                    )}
                  </Typography>
                  {chore.dueDate && (
                    <Typography level='body2' color='text.tertiary'>
                      Due: {moment(chore.dueDate).format('ddd MM/DD/yyyy')}
                    </Typography>
                  )}
                  {chore.notes && (
                    <Typography level='body2' color='text.tertiary'>
                      Note: {chore.notes}
                    </Typography>
                  )}
                </ListItemContent>
              </ListItem>
              {index < choreHistory.length - 1 && (
                <>
                  <ListDivider component='li'>
                    {/* time between two completion: */}
                    {index < choreHistory.length - 1 &&
                      choreHistory[index + 1].completedAt && (
                        <Typography level='body3' color='text.tertiary'>
                          {formatTimeDifference(
                            chore.completedAt,
                            choreHistory[index + 1].completedAt,
                          )}{' '}
                          before
                        </Typography>
                      )}
                  </ListDivider>
                </>
              )}
            </>
          ))}
        </List>
      </Box>
    </Container>
  )
}

export default ChoreHistory