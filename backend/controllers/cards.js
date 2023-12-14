const Card = require('../models/card');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');
const DeleteCardError = require('../errors/DeleteCardError');

module.exports.getCards = async (req, res) => {
  try {
    const cards = await Card.find({});
    return res.send(cards);
  } catch (error) {
    return res.status(500).send({ message: 'На сервере произошла ошибка' });
  }
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  // console.log(req.user._id); // _id станет доступен
  const ownerId = req.user._id;
  Card.create({ name, link, owner: ownerId })
    .then((newCard) => {
      res.status(201).send({ data: newCard });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Невалидные данные'));
        //  return res.status(400).send({ message: 'Невалидные данные' });
      } else {
        next(err);
      }
    });
};

module.exports.deleteCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findById(cardId)
    .then((card) => {
      if (card == null) {
        throw new NotFoundError('Карточка не найдена');
      }
      if (!(card.owner._id.toString() === req.user._id)) {
        throw new DeleteCardError('Нельзя удалить чужую карточку!');
      }
      return Card.findByIdAndDelete(cardId)
        .then((cardDelete) => res.send(cardDelete))
        .catch(next);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new ValidationError('Переданы некорректные данные для удаления карточки'));
      } else {
        next(err);
      }
    });
};

module.exports.likeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  {
    $addToSet: { likes: req.user._id },
  },
  { new: true },
)
  .populate(['owner', 'likes'])
  .then((card) => {
    if (card == null) {
      throw new NotFoundError('Карточка не найдена');
    }
    return res.send(card);
  })
  .catch((err) => {
    if (err.name === 'CastError') {
      next(new ValidationError('Переданы некорректные данные'));
    } else {
      next(err);
    }
  });

module.exports.dislikeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  {
    $pull: { likes: req.user._id },
  },
  { new: true },
)
  .populate(['owner', 'likes'])
  .then((card) => {
    if (card == null) {
      throw new NotFoundError('Карточка не найдена');
    }
    return res.send(card);
  })
  .catch((err) => {
    if (err.name === 'CastError') {
      next(new ValidationError('Переданы некорректные данные'));
    } else {
      next(err);
    }
  });
