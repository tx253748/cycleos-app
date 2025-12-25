'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useFirestore = (initialState) => {
  const { user } = useAuth();
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ユーザーのドキュメントパス
  const getDocRef = useCallback(() => {
    if (!user) return null;
    return doc(db, 'users', user.uid);
  }, [user]);

  // データを読み込む
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const docRef = getDocRef();
    if (!docRef) return;

    // リアルタイムリスナー
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setState(docSnap.data());
        } else {
          // 新規ユーザー: 初期状態を保存
          setState(initialState);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, getDocRef]);

  // データを保存
  const saveState = useCallback(async (newState) => {
    const docRef = getDocRef();
    if (!docRef) {
      console.warn('No user logged in, cannot save');
      return;
    }

    try {
      const stateToSave = typeof newState === 'function' ? newState(state) : newState;
      await setDoc(docRef, stateToSave, { merge: true });
      setState(stateToSave);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message);
    }
  }, [getDocRef, state]);

  return [state, saveState, { loading, error }];
};
