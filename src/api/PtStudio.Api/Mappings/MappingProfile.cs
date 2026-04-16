using AutoMapper;
using PtStudio.Api.DTOs;
using PtStudio.Api.Models;

namespace PtStudio.Api.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, TokenResponseDto>()
            .ForMember(d => d.Role, opt => opt.MapFrom(s => s.Role.ToString()));

        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, opt => opt.MapFrom(s => s.Role.ToString()));

        CreateMap<Trainer, TrainerDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.User.FullName))
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User.Email))
            .ForMember(d => d.Phone, opt => opt.MapFrom(s => s.User.Phone));

        CreateMap<Client, ClientDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.User.FullName))
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User.Email))
            .ForMember(d => d.Phone, opt => opt.MapFrom(s => s.User.Phone));

        CreateMap<Package, PackageDto>();

        CreateMap<ClientPackage, ClientPackageDto>()
            .ForMember(d => d.ClientFullName, opt => opt.MapFrom(s => s.Client.User.FullName))
            .ForMember(d => d.PackageName, opt => opt.MapFrom(s => s.Package.Name))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));
    }
}
