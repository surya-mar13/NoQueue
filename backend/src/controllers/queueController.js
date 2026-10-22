const queueService = require('../services/queueService');

const join = async (req, res, next) => {
  try {
    const entry = await queueService.joinQueue(req.user._id, req.params.locationId);
    res.status(201).json({
      success: true,
      message: 'Successfully joined the queue',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const leave = async (req, res, next) => {
  try {
    const entry = await queueService.leaveQueue(req.user._id, req.params.locationId);
    res.status(200).json({
      success: true,
      message: 'Successfully left the queue',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const getLiveQueue = async (req, res, next) => {
  try {
    const entries = await queueService.getLiveQueue(req.params.locationId);
    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

const getMyActive = async (req, res, next) => {
  try {
    const entry = await queueService.getMyActiveQueue(req.user._id);
    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const getMyHistory = async (req, res, next) => {
  try {
    const history = await queueService.getMyQueueHistory(req.user._id);
    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

const callNext = async (req, res, next) => {
  try {
    const entry = await queueService.callNext(req.params.locationId);
    res.status(200).json({
      success: true,
      message: 'Next user called',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const entry = await queueService.updateEntryStatus(req.params.entryId, status);
    res.status(200).json({
      success: true,
      message: `Queue entry marked as ${status}`,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  join,
  leave,
  getLiveQueue,
  getMyActive,
  getMyHistory,
  callNext,
  updateStatus,
};