using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class StoreIds 
{
    public int[] id;

    public StoreIds(int[] id)
    {
        this.id = id;
    }
}


public class StoreList
{
    public List<int> id;

    public StoreList(List<int> id)
    {
        this.id = id;
    }
}