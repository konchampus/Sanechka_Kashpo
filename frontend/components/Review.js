import { useState } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

export default function Review({ productId, reviews }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reviews', { productId, rating, comment });
      toast.success('Отзыв добавлен!');
      setRating(0);
      setComment('');
    } catch (error) {
      toast.error('Ошибка добавления отзыва');
    }
  };

  return (
    <div className="mt-4">
      <h4>Отзывы</h4>
      {reviews.map(review => (
        <div key={review._id} className="border-bottom py-2">
          <p><strong>{review.user.name}</strong>: {review.rating} ★</p>
          <p>{review.comment}</p>
        </div>
      ))}
      {Cookies.get('token') && (
        <form onSubmit={submitReview} className="mt-3">
          <div className="mb-3">
            <label>Оценка:</label>
            <select className="form-control" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              <option value="0">Выберите</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <div className="mb-3">
            <textarea
              className="form-control"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ваш отзыв"
            />
          </div>
          <button type="submit" className="btn btn-primary">Отправить</button>
        </form>
      )}
    </div>
  );
}