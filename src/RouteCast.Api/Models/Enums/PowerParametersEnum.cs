namespace RouteCast.Api.Models.Enums
{
    public enum PowerParams
    {
        //temperatura a 2 metros
        T2M,

        // temperatura de ponto de orvalho
        T2MDEW,

        // total de radiação soalr
        ALLSKY_SFC_SW_DWN,
        
        // radiação céu limpo
        CLRSKY_SFC_SW_DWN,
        
        //precipitação
        PRECTOTCORR,

        // vento 2 metros
        WS2M,
        
        // vento 10 metros
        WS10M,

        //umidade relativa a 2 metros
        RH2M,

        //quantidade de nuvens
        CLOUD_AMT
    }
}
