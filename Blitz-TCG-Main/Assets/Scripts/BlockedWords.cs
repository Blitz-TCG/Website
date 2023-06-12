using UnityEngine;
using System.Collections.Generic;

public class BlockedWords : MonoBehaviour
{
    public static BlockedWords instance;
    public List<string> blockedWordsList = new List<string>();

    private void Awake()
    {
        DontDestroyOnLoad(gameObject);

        if (instance == null)
        {
            instance = this;
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        blockedWordsList.Add("fuck");
        blockedWordsList.Add("bitch");
        blockedWordsList.Add("faggot");
        blockedWordsList.Add("shit");
        blockedWordsList.Add("penis");
        blockedWordsList.Add("dick");
        blockedWordsList.Add("bastard");
        blockedWordsList.Add("cock");
        blockedWordsList.Add("pussy");
        blockedWordsList.Add("twat");
        blockedWordsList.Add("cunt");
        blockedWordsList.Add("nigger");
        blockedWordsList.Add("niglet");
        blockedWordsList.Add("chink");
        blockedWordsList.Add("dothead");
        blockedWordsList.Add("gringo");
        blockedWordsList.Add("wetback");
        blockedWordsList.Add("raghead");
        blockedWordsList.Add("redskin");
    }

}
