using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

public enum CardClass
{
    GeneralRed = 1,
    GeneralGreen = 2,
    GeneralBlue = 3
}

[System.Serializable]
public class Card : MonoBehaviour
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


    public int cardId;
    
    public TMP_Text cardNameText;
    public TMP_Text cardDescriptionText;
    public TMP_Text attackText;
    public TMP_Text HPText;
    public TMP_Text goldText;
    public TMP_Text XPText;
    public TMP_Text abilityText;
    public TMP_Text levelRequiredText;
    public Image image;
    public TMP_Text EDText;
    public TMP_Text RText;

    public void SetProperties(int identity,string cName,string cDescription, int cAttack, int cHP,int cGold, int cXP, string cAbility, string cLevelRequired, Sprite cImage, int cED,int cR, CardClass cardclass)
    {
        cardId = identity;
        cardNameText.text = cName;
        cardDescriptionText.text = cDescription.ToString();
        attackText.text = cAttack.ToString();
        HPText.text = cHP.ToString();
        goldText.text = cGold.ToString();
        XPText.text = cXP.ToString();
        abilityText.text = cAbility.ToString();
        levelRequiredText.text = cLevelRequired.ToString();
        image.sprite = cImage;
        EDText.text = cED.ToString();
        RText.text = cR.ToString();

        id = identity;
        cardName = cName;
        cardDescription = cDescription;
        attack = cAttack;
        HP = cHP;
        gold = cGold;
        XP = cXP;
        ability = cAbility;
        levelRequired = cLevelRequired;
        image.sprite = cImage;
        ED = cED;
        R = cR;
        cardClass = cardclass;
    }

}
