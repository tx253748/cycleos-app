'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useFirestore = (initialState) => {
  const { user } = useAuth();
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const stateRef = useRef(state);

  // stateが変わるたびにrefを更新
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
          const data = docSnap.data();
          setState(data);
          stateRef.current = data;
        } else {
          // 新規ユーザー: 初期状態を保存
          setState(initialState);
          stateRef.current = initialState;
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
      // 関数の場合は最新のstateRefを使用
      const stateToSave = typeof newState === 'function' 
        ? newState(stateRef.current) 
        : newState;
      
      // ローカル状態を即時更新
      setState(stateToSave);
      stateRef.current = stateToSave;
      
      // Firestoreに保存
      await setDoc(docRef, stateToSave, { merge: true });
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message);
    }
  }, [getDocRef]);

  return [state, saveState, { loading, error }];
};
