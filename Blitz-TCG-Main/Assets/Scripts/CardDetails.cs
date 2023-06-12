using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;


[System.Serializable]
public class CardDetails
{
    public int id;
    public string cardName;
    public string cardDescription;
    public int attack;
    public int HP;
    public int gold;
    public int XP;
    public int race;
    public string levelRequired;
    public int ED;
    public int R;
    public string ability;
    public CardClass cardClass;
    public Sprite cardImage;
}