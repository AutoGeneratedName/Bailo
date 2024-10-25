import { describe, expect, test, vi } from 'vitest'

import AccessRequest from '../../src/models/AccessRequest.js'
import Model from '../../src/models/Model.js'
import Release from '../../src/models/Release.js'
import {
  createAccessRequestReviews,
  createReleaseReviews,
  findReviewForAccessRequest,
  findReviews,
  removeAccessRequestReview,
} from '../../src/services/review.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/connectors/authentication/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const reviewModelMock = vi.hoisted(() => {
  const obj: any = { kind: 'access', accessRequestId: 'Hello', role: 'msro' }

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.limit = vi.fn(() => obj)
  obj.unwind = vi.fn(() => obj)
  obj.at = vi.fn(() => obj)
  obj.map = vi.fn(() => [])
  obj.filter = vi.fn(() => [])

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})

vi.mock('../../src/models/Review.js', async () => ({
  ...((await vi.importActual('../../src/models/Review.js')) as object),
  default: reviewModelMock,
}))

const smtpMock = vi.hoisted(() => ({
  notifyReviewResponseForAccess: vi.fn(() => Promise.resolve()),
  notifyReviewResponseForRelease: vi.fn(() => Promise.resolve()),
  requestReviewForRelease: vi.fn(() => Promise.resolve()),
  requestReviewForAccessRequest: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../src/services/smtp/smtp.js', async () => smtpMock)

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/model.js', async () => modelMock)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))
const arrayUtilMock = vi.hoisted(() => ({
  asyncFilter: vi.fn(),
}))
vi.mock('../../src/utils/array.js', async () => arrayUtilMock)

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviews > all reviews for user', async () => {
    await findReviews(user, true)

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviews > active reviews for a specific model', async () => {
    await findReviews(user, false, 'modelId')

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviewForAccessRequest > success', async () => {
    await findReviewForAccessRequest(reviewModelMock.accessRequestId)

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('findReviewForAccessRequest > failure', async () => {
    reviewModelMock.findOne.mockResolvedValue(undefined)

    expect(() => findReviewForAccessRequest('')).rejects.toThrowError(
      /^The requested access request review was not found./,
    )
  })

  test('createReleaseReviews > No entities found for required roles', async () => {
    const result: Promise<void> = createReleaseReviews(new Model(), new Release())

    expect(smtpMock.requestReviewForRelease).not.toBeCalled()
    expect(result).resolves.not.toThrowError()
    expect(reviewModelMock.save).toBeCalled()
  })

  test('createReleaseReviews > successful', async () => {
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new Release(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
  })

  test('createAccessRequestReviews > successful', async () => {
    await createAccessRequestReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new AccessRequest(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForAccessRequest).toBeCalled()
  })

  test('removeAccessRequestReview > successful', async () => {
    await removeAccessRequestReview(reviewModelMock.accessRequestId)

    expect(reviewModelMock.delete).toBeCalled()
  })

  test('removeAccessRequestReview > failure', async () => {
    reviewModelMock.findOne.mockResolvedValue(undefined)

    expect(() => removeAccessRequestReview('')).rejects.toThrowError(
      /^The requested access request review was not found./,
    )
  })
})
