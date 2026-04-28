export type PhraseologyStatus = 'unknown' | 'known' | 'difficult';

export type PhraseologyCard = {
  id: string;
  category: string;
  situation: string;
  expectedPhraseFrench: string;
  expectedPhraseEnglish: string;
  explanation: string;
  status: PhraseologyStatus;
};
